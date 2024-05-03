import type { SupabaseClient } from '@supabase/supabase-js';

import QStashTaskQueue from '~/core/queues/task-queue.impl';
import { getChatbot } from '~/lib/chatbots/queries';
import Crawler from '~/core/crawler';
import parallelizeBatch from '~/core/generic/parallelize-batch';
import getLogger from '~/core/logger';
import { insertJob } from '~/lib/jobs/mutations';
import { Database } from '~/database.types';
import getSupabaseServerActionClient from '~/core/supabase/action-client';

type TaskParams = {
  chatbotId: string;
  delay: number;
  links: string[];
  jobId: number;
};

export default class ChatbotTaskQueue {
  private readonly queue = new QStashTaskQueue<TaskParams>();

  private static MAX_LINKS_PER_JOB = 30;
  private static DELAY_BETWEEN_JOBS_MS = 500;
  private static DELAY_BETWEEN_TASKS_S = 25;

  async createJob(
    client: SupabaseClient<Database>,
    params: {
      chatbotId: string;

      filters: {
        allow: string[];
        disallow: string[];
      };
    },
  ) {
    const logger = getLogger();
    const crawler = new Crawler();

    logger.info(
      {
        chatbotId: params.chatbotId,
      },
      `Creating chatbot crawling job...`,
    );

    const chatbot = await getChatbot(client, params.chatbotId);
    const { sites } = await crawler.getSitemapLinks(chatbot.url);
    const links = crawler.filterLinks(sites, params.filters);

    // verify if organization is over quota before creating job
    const canCreateJob = await client.rpc('can_index_documents', {
      org_id: chatbot.organizationId,
      requested_documents: links.length,
    });

    // if organization is over quota, throw error
    if (!canCreateJob.data) {
      return Promise.reject(`Can't create job. Organization is over quota.`);
    }

    // if organization is not over quota, create job
    const totalJobs = Math.ceil(
      links.length / ChatbotTaskQueue.MAX_LINKS_PER_JOB,
    );

    const jobsGroups: Array<string[]> = [];

    for (let n = 0; n < totalJobs; n++) {
      const startIndex = n * ChatbotTaskQueue.MAX_LINKS_PER_JOB;

      const jobSites = links.slice(
        startIndex,
        startIndex + ChatbotTaskQueue.MAX_LINKS_PER_JOB,
      );

      jobsGroups.push(jobSites);
    }

    if (jobsGroups.length === 0) {
      logger.info(
        {
          chatbotId: params.chatbotId,
          organizationId: chatbot.organizationId,
        },
        `No links found. Skipping job creation.`,
      );

      throw new Error('No links found');
    }

    logger.info(
      {
        numberOfJobs: totalJobs,
        numberOfLinks: links.length,
        chatbotId: params.chatbotId,
        organizationId: chatbot.organizationId,
      },
      `Fetched SiteMap links. Inserting job...`,
    );

    const adminClient = getSupabaseServerActionClient({
      admin: true
    });

    const job = await insertJob(adminClient, {
      chatbotId: params.chatbotId,
      organizationId: chatbot.organizationId,
      totalTasks: links.length,
    });

    if (job.error) {
      logger.error(
        {
          chatbotId: params.chatbotId,
          error: job.error,
          organizationId: chatbot.organizationId,
        },
        `Error inserting job`,
      );

      throw job.error;
    }

    logger.info(
      {
        chatbotId: params.chatbotId,
        jobId: job.data.id,
      },
      `Successfully created job record for chatbot`,
    );

    logger.info(
      {
        chatbotId: params.chatbotId,
        jobId: job.data.id,
        numberOfTasks: jobsGroups.length,
      },
      `Creating tasks...`,
    );

    // for each job, we delay it by {ChatbotTaskQueue.DELAY_BETWEEN_JOBS_MS} ms
    // to be nice to the website we're crawling
    const requests = jobsGroups.map((jobSites, index) => {
      const delay = index * ChatbotTaskQueue.DELAY_BETWEEN_JOBS_MS;

      return () => this.queue.create({
        chatbotId: params.chatbotId,
        jobId: job.data.id,
        delay,
        links: jobSites,
      });
    });

    // for each task, we delay it by {ChatbotTaskQueue.DELAY_BETWEEN_TASKS_S}
    const concurrentBatches = 2;
    // delay between each batch in seconds
    const delayBetweenTasks = ChatbotTaskQueue.DELAY_BETWEEN_TASKS_S;

    const results = await parallelizeBatch(
      requests,
      concurrentBatches,
      delayBetweenTasks,
    );

    const jobsStarted = results.filter((result) => result.messageId);

    logger.info(
      {
        chatbotId: params.chatbotId,
        jobId: job.data.id,
        numberOfJobs: results.length,
        numberOfJobsStarted: jobsStarted.length,
      },
      `Finalized job creation`,
    );

    return chatbot;
  }

  async verify(request: Request) {
    const body = await request.text();
    const signature = request.headers.get('Upstash-Signature');

    if (!signature) {
      throw new Error('Missing Upstash-Signature header');
    }

    return this.queue.verify({
      body,
      signature,
    });
  }
}
