import { HtmlBasePlugin } from "@11ty/eleventy";
import QRCode from "qrcode";

export default function (eleventyConfig) {
  eleventyConfig.addPassthroughCopy({ "src/assets": "assets" });
  eleventyConfig.addPassthroughCopy({ "images": "images" });
  eleventyConfig.addPlugin(HtmlBasePlugin);

  // Build-time QR code generated from a URL, emitted as inline SVG (crisp in print).
  eleventyConfig.addAsyncShortcode("qrcode", (url) =>
    QRCode.toString(url, { type: "svg", margin: 0, errorCorrectionLevel: "M" })
  );

  return {
    dir: {
      input: "src",
      output: "dist",
      includes: "_includes",
      data: "_data",
    },
    pathPrefix: "/cv",
    markdownTemplateEngine: "njk",
    htmlTemplateEngine: "njk",
    templateFormats: ["md", "njk", "html"],
  };
}
