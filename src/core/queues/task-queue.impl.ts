import AbstractTaskQueue from './task-queue';
import { Client, Receiver } from '@upstash/qstash';
import invariant from 'tiny-invariant';

const QSTASH_TOKEN = process.env.QSTASH_TOKEN;
const QSTASH_URL = process.env.QSTASH_URL;
const QSTASH_CURRENT_SIGNING_KEY = process.env.QSTASH_CURRENT_SIGNING_KEY;
const QSTASH_NEXT_SIGNING_KEY = process.env.QSTASH_NEXT_SIGNING_KEY;

type VerifyParams = {
  body: string;
  signature: string;
}

/**
 * TaskQueue class is an implementation of the AbstractTaskQueue interface using QStash.
 * It provides methods for creating a chatbot message and verifying the authenticity of a message using a digital signature.
 */
class QStashTaskQueue<Body extends {
  delay?: number;
  deduplicationId?: string;
}> implements AbstractTaskQueue<Body, VerifyParams> {
  private client = this.createClient();

  /**
   * Creates a new chatbot message.
   *
   * @param body
   */
  async create(body: Body) {
    invariant(QSTASH_URL, 'QSTASH_QUEUE_URL is required');

    try {
      return this.client.publishJSON({
        url: QSTASH_URL,
        body,
        delay: body.delay,
        deduplicationId: body.deduplicationId,
      });
    } catch (error) {
      console.error(`Failed to create message: ${error}`);
      throw error;
    }
  }

  /**
   * Verifies the authenticity of a message using a digital signature.
   *
   * @param {Object} params - An object containing the body and signature of the message.
   * @param {string} params.body - The body of the message. This is the raw JSON body of the message.
   * @param {string} params.signature - The digital signature of the message. Passed by the "Upstash-Signature" header.
   **/
  async verify(params: VerifyParams) {
    invariant(
      QSTASH_CURRENT_SIGNING_KEY,
      'QSTASH_CURRENT_SIGNING_KEY is required',
    );

    invariant(QSTASH_NEXT_SIGNING_KEY, 'QSTASH_NEXT_SIGNING_KEY is required');

    const receiver = new Receiver({
      currentSigningKey: QSTASH_CURRENT_SIGNING_KEY,
      nextSigningKey: QSTASH_NEXT_SIGNING_KEY,
    });

    const isValid = await receiver.verify(params);

    if (!isValid) {
      throw new Error('Invalid signature');
    }
  }

  private createClient() {
    invariant(QSTASH_TOKEN, 'QSTASH_TOKEN is required');

    return new Client({
      token: QSTASH_TOKEN,
    });
  }
}

export default QStashTaskQueue;