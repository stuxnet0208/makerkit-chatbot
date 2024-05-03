import parse from 'node-html-parser';
import HtmlCleaner from '~/core/html-cleaner';

export default class Parser {
  async parse(html: string, host: string) {
    const { Readability } = require("@mozilla/readability");

    const document = await this.createDocument(html);
    const reader = new Readability(document);
    const parsed = reader.parse();
    const cleanedContent = this.cleanHtml(parsed.content, host);
    const content = await this.convertToMarkdown(cleanedContent);
    const title = this.getTitle(html) ?? parsed.title;

    return {
      title,
      content,
    }
  }

  private async convertToMarkdown(html: string) {
    const { NodeHtmlMarkdown } = await import('node-html-markdown');

    return NodeHtmlMarkdown.translate(html);
  }

  private async createDocument(html: string) {
    const { Window } = await import('happy-dom');
    const window = new Window();
    const document = window.document;

    document.write(html);

    return document;
  }

  private cleanHtml(content: string, host: string) {
    const cleaner = new HtmlCleaner(content, host);

    return cleaner.clean();
  }

  private getTitle(content: string) {
    const html = parse(content);
    const title = html.querySelector('title');

    return title ? title.rawText : '';
  }
}
