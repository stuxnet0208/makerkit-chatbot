export default class Crawler {
  async getSitemapLinks(url: string) {
    const sitemapUrl = this.getSitemapUrl(url);
    const { default: Sitemapper } = await import('sitemapper');

    const sitemap = new Sitemapper({
      url: sitemapUrl,
    });

    return await sitemap.fetch();
  }

  async crawl(url: string) {
    const response = await fetch(url);

    return await response.text();
  }

  filterLinks(
    sites: string[],
    {
      allow,
      disallow,
    }: {
      allow: string[];
      disallow: string[];
    },
  ) {
    const allowList = allow.filter(Boolean);
    const disallowList = disallow.filter(Boolean);

    return sites.filter((site) => {
      const isAllowed = allowList.length
        ? allowList.some((pattern) => site.includes(pattern))
        : true;

      const isDisallowed = disallowList.length
        ? disallowList.some((pattern) => site.includes(pattern))
        : false;

      return isAllowed && !isDisallowed;
    });
  }

  /**
   * Get the URL of the sitemap for a given website URL. The sitemap URL is inferred from the website URL.
   * If the website URL ends with `.xml`, it is assumed to be the sitemap URL.
   * TODO: this function does not take into account sitemap index files or sitemaps that are not named `sitemap.xml`.
   * Solution: crawl the robots.txt file and look for the sitemap URL.
   *
   * @param {string} websiteUrl - The URL of the website.
   * @return {string} - The URL of the sitemap.
   */
  private getSitemapUrl(websiteUrl: string) {
    if (websiteUrl.endsWith('.xml')) {
      return websiteUrl;
    }

    return `${websiteUrl}/sitemap.xml`;
  }
}
