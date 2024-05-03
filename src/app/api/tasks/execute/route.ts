import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createHash } from 'crypto';

import Crawler from '~/core/crawler';
import Parser from '~/core/parser';

import getVectorStore from '~/lib/server/chatbot/vector-store';
import parallelizeBatch from '~/core/generic/parallelize-batch';
import getSupabaseRouteHandlerClient from '~/core/supabase/route-handler-client';
import getLogger from '~/core/logger';
import { getJobById } from '~/lib/jobs/queries';
import { updateJob } from '~/lib/jobs/mutations';
import ChatbotTaskQueue from '~/lib/chatbots/chatbot-task-queue';
import { getDocumentByHash } from '~/lib/chatbots/queries';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';

const DOCUMENT_CHUNK_SIZE = process.env.DOCUMENT_CHUNK_SIZE ? Number(process.env.DOCUMENT_CHUNK_SIZE) : 1500;

/*
  * This route is called by the Task Queue to crawl a list of links
 */
const MAX_RETRIES = 3;

export const POST = async (req: NextRequest) => {
  const taskQueue = new ChatbotTaskQueue();
  const logger = getLogger();

  getLogger().info(`Received Task message. Authenticating...`);

  try {
    await taskQueue.verify(req.clone());
  } catch (error) {
    logger.error({
      error,
    }, `Authentication failed.`);

    return new Response(`Invalid Request`, {
      status: 403
    });
  }

  return handler(req);
};

async function handler(req: NextRequest) {
  const logger = getLogger();
  const body = getBodySchema().parse(await req.json());

  logger.info(`Request authenticated. Validating body...`);

  const retriesHeader = req.headers.get('Upstash-Retries');
  const retries = retriesHeader ? parseInt(retriesHeader) : 0;

  logger.info({
    jobId: body.jobId,
  }, `Body successfully validated`);

  const supabase = getSupabaseRouteHandlerClient({
    admin: true,
  });

  // we fetch the job to make sure it exists
  const jobResponse = await getJobById(supabase, body.jobId);

  if (jobResponse.error || !jobResponse.data) {
    return handleError({
      retries,
      jobId: body.jobId,
      error: jobResponse.error,
    });
  }

  const crawler = new Crawler();
  const parser = new Parser();
  const vectorStore = await getVectorStore(supabase);

  logger.info({
    links: body.links.length,
  }, `Crawling links...`);

  const requests = body.links.map((url) => {
    return async () => {
      async function fetchPage() {
        try {
          const host = new URL(url).origin;
          const contents = await crawler.crawl(url);

          return await parser.parse(contents, host);
        } catch (e) {
          getLogger().warn({
            url,
            error: e,
            jobId: body.jobId,
          }, `Error crawling URL`);

          throw e;
        }
      }

      try {
        const { content, title } = await fetchPage();
        const hash = sha256(content);

        // we try avoid indexing the embedding twice
        // by looking the same hash in the DB
        const existingDocument = await getDocumentByHash(supabase, {
          hash,
          chatbotId: body.chatbotId
        });

        if (existingDocument) {
          return {
            success: false,
          };
        }

        const organizationId = jobResponse.data.organizationId;

        const documentResponse = await supabase
          .from('documents')
          .insert({
            title,
            chatbot_id: body.chatbotId,
            organization_id: organizationId,
            content
          })
          .select('id')
          .single();

        if (documentResponse.error) {
          throw documentResponse.error;
        }

        const splitter = new RecursiveCharacterTextSplitter({
          chunkSize: DOCUMENT_CHUNK_SIZE,
          chunkOverlap: 0,
        });

        logger.info({
          title,
          organizationId,
          ...body,
        }, `Splitting document...`)

        const splittedDocs = await splitter.splitText(content);

        const documentEmbeddings = splittedDocs.map(item => {
          return {
            pageContent: item,
            metadata: {
              title: title,
              hash,
              url,
              organization_id: organizationId,
              chatbot_id: body.chatbotId,
              document_id: documentResponse.data.id,
            },
          };
        });

        logger.info({
          title,
          organizationId,
          ...body,
        }, `Indexing documents...`)

        // generate embeddings and summarize
        await vectorStore.addDocuments(documentEmbeddings);

        logger.info({
          title,
          organizationId,
          ...body,
        }, `Documents indexed.`)

        return {
          success: true,
        };
      } catch (error) {
        console.error(error);

        return {
          success: false,
          error,
        };
      }
    };
  });

  const concurrentRequests = 2;
  const delayBetweenRequestsMs = 1000;

  // run requests in parallel with a delay between each batch
  const tasks = await parallelizeBatch(requests, concurrentRequests, delayBetweenRequestsMs);

  const successfulTasks = tasks.filter((task) => task.success);
  const erroredTasks = tasks.length - successfulTasks.length;

  const processedTasks = successfulTasks.length + erroredTasks;

  logger.info({
    successfulTasks,
    erroredTasks,
  }, `Crawling links done.`);

  logger.info(`Updating job ${body.jobId}...`);

  // we fetch the job again to get the latest version
  const { error, data: job } = await getJobById(supabase, body.jobId);

  if (error) {
    return handleError({
      retries,
      jobId: body.jobId,
      error,
    });
  }

  const completedTasksCount = job.tasksCompleted + processedTasks;
  const successfulTasksCount = job.tasksSucceeded + successfulTasks.length;

  const isStatusFinished = completedTasksCount >= job.tasksCount;
  const status = isStatusFinished ? 'completed' : job.status;

  const updateResponse = await updateJob(supabase, body.jobId, {
    tasks_completed_count: completedTasksCount,
    tasks_succeeded_count: successfulTasksCount,
    status
  });

  if (updateResponse.error) {
    return handleError({
      retries,
      jobId: body.jobId,
      error: updateResponse.error,
    });
  }

  return NextResponse.json({
    success: true,
  });
}

function handleError(params: {
  retries: number;
  jobId: number;
  error: unknown
}) {
  const logger = getLogger();

  logger.error({
    jobId: params.jobId,
    error: params.error,
  }, `Error executing job.`);

  // if we can't fetch the job, we abort. The Task Queue will retry the request
  if (params.retries < MAX_RETRIES) {
    return NextResponse.json({
      success: false
    }, {
      status: 500,
    });
  }

  // we have retried the request 3 times, so we abort by returning a 200
  return NextResponse.json({
    success: true,
  }, {
    status: 200,
  });
}

function sha256(content: string) {
  return createHash('sha256').update(content).digest('hex');
}

function getBodySchema() {
  return z
    .object({
      chatbotId: z.string().uuid(),
      jobId: z.number(),
      links: z.array(z.string().url()),
    })
}