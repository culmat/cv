import { HtmlBasePlugin } from "@11ty/eleventy";
import QRCode from "qrcode";

export default function (eleventyConfig) {
  eleventyConfig.addPassthroughCopy({ "src/assets": "assets" });
  eleventyConfig.addPassthroughCopy({ "images": "images" });
  eleventyConfig.addPlugin(HtmlBasePlugin);

  // Build-time QR code generated from any string, emitted as inline SVG (crisp in
  // print, sharp on screen). Defaults to "M" error correction; callers encoding a
  // large payload (e.g. a vCard) can pass "L" to keep the code less dense/scannable.
  eleventyConfig.addAsyncShortcode("qrcode", (data, errorCorrectionLevel = "M") =>
    QRCode.toString(data, { type: "svg", margin: 0, errorCorrectionLevel })
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
