import * as highlightjs from "highlight.js";
import { getTheme } from "./theme";
const { JSDOM } = require("jsdom");

interface GeneratorOptions {
    theme: {
        [key: string]: any;
    }; // 'light' or 'dark' mode
    themeName?: string;
    language?: string;
    fontSize: number; // Line thickness and width
    leading: number; // Space between lines
    lineCap: "round" | "square"; // Line ends 'square' or 'round'
    margin: number; // Space between canvas edges and code block
    lineNumbers: boolean; // Whether or not to include line numbers
    lineNumberOffset: number; // Line number offset from margin
}

async function getDefaultOptions(): Promise<GeneratorOptions> {
    const themeName = "atom-one-dark-reasonable";
    const defaultTheme = await getTheme(themeName);

    return {
        theme: defaultTheme,
        themeName,
        fontSize: 5,
        leading: 10,
        lineCap: "round",
        margin: 50,
        lineNumbers: false,
        lineNumberOffset: -3,
    };
}

interface Node {
    nodeName: string;
    textContent: string;
    className: string | undefined;
}

function generateSVG(code: string, options: GeneratorOptions): string {
    function drawRect(
        x: number,
        y: number,
        width: number,
        height: number,
        fillColor: string
    ) {
        const fill = fillColor;
        const rect = `<rect x="${x}" y="${y}" width="${width}" height="${height}" fill="${fill}" />`;
        return rect;
    }

    function drawLine(x: number, y: number, dx: number, color: string = "") {
        let output = "";
        if (Math.abs(dx) > 0) {
            const x1 = x * options.fontSize + options.margin;
            const x2 = x1 + dx * options.fontSize;
            const y1 = y * options.leading + options.margin;
            const y2 = y1;

            const offset = x > 0 ? options.fontSize / 2 : (options.fontSize / 2) * -1;
            const strokeAttr = color ? `stroke="${color}" ` : "";

            output += `   <line x1="${x1 + offset}" y1="${y1}" x2="${
                x2 - offset
                }" y2="${y2}" ${strokeAttr}/>`;
        }
        return output;
    }

    function splitAndTrim(text: string) {
        const output = [];
        const { length } = text;
        let segment:
            | { start: number; end?: number; text?: string; length?: number }
            | undefined;
        for (let position = 0; position <= length; position += 1) {
            if (!segment && text[position] !== " ") {
                segment = { start: position };
            }
            if (segment && !segment.end) {
                if (text[position] === " " || position === length) {
                    segment.end = position;
                    segment.text = text.slice(segment.start, segment.end);
                    segment.length = segment.text.length;
                    output.push(segment);
                    segment = undefined;
                }
            }
        }
        return output;
    };

    function createCodeLine(line: Array<Node>, y: number) {
        let indent = 0;
        return line
            .map(
                (element: {
                    nodeName: string;
                    textContent: string;
                    className: string | undefined;
                }) => {
                    const { nodeName, textContent, className } = element;
                    if (textContent === "\n") return "";

                    const color =
                        nodeName === "SPAN" && options.theme[`.${className}`]
                            ? options.theme[`.${className}`].color
                            : options.theme[`.hljs`].color;
                    switch (nodeName) {
                        case "SPAN":
                            const line = drawLine(indent, y, textContent.length, color);
                            indent += textContent.length;
                            return line;
                        case "#text":
                            const lines = splitAndTrim(textContent).map((obj) => {
                                const { start, text } = obj;
                                return drawLine(
                                    indent + start,
                                    y,
                                    text ? text.length : 0,
                                    color
                                );
                            });
                            indent += textContent.length;
                            return lines;
                        default:
                            console.error("Unexpected nodeName");
                            return [];
                    }
                }
            )
            .reduce((a: Array<string>, b: Array<string> | string) => a.concat(b), [])
            .join("\n");
    }
    function getHeight() {
        return (lines.length - 1) * options.leading + options.margin * 2;
    }

    function getWidth() {
        const linesLength = lines.map((line): number => {
            const lineLength = line.reduce(
                (sum, node) => sum + node.textContent.length,
                0
            );

            return lineLength;
        });

        const maxLength = Math.max(...linesLength);
        return maxLength * options.fontSize + options.margin * 2;
    }
    const higlighted = options.language
        ? highlightjs.highlight(options.language, code)
        : highlightjs.highlightAuto(code);

    const lines: Array<Array<Node>> = higlighted.value.split("\n").map((line) => {
        const { document } = new JSDOM(`<body>${line}</body>`).window;
        return Array.from(document.body.childNodes);
    });

    const height = getHeight();
    const width = getWidth();

    const startSvg = `<svg class="faux code" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">\n`;
    const endSvg = "</svg>";
    const background = drawRect(
        0,
        0,
        width,
        height,
        options.theme[`.hljs`].background
    );

    const startG = `<g class="code block" stroke-linecap="${options.lineCap}" stroke-width="${options.fontSize}">\n`;
    const endG = "</g>\n";
    const innerCodeBlock = lines
        .map((line, index) => {
            return startG + createCodeLine(line, index) + endG;
        })
        .join("\n");
    const codeBlock = startG + innerCodeBlock + endG;
    return startSvg + background + codeBlock + endSvg;
}

export { GeneratorOptions, getDefaultOptions, generateSVG };
