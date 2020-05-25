import * as highlightjs from "highlight.js";
import { getTheme } from "./theme";
import { range } from "./utils"
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
    childNodes: any;
}

class Generator {
    private options: GeneratorOptions;

    private code: string;
    private highlightedLines: Array<Array<Node>> = [];

    constructor(code: string, options: GeneratorOptions) {
        this.code = code;
        this.options = options;
        this.parseCode(code);
    }

    public updateOptions(newOptions: GeneratorOptions) {
        this.options = newOptions;
        return this;
    }
    public parseCode(code: string) {
        this.code = code;

        const language = this.options.language;
        const highlighted =
            language && highlightjs.listLanguages().includes(language)
                ? highlightjs.highlight(language, code)
                : highlightjs.highlightAuto(code);

        this.highlightedLines = highlighted.value.split("\n").map((line) => {
            const { document } = new JSDOM(`<body>${line}</body>`).window;
            return Array.from(document.body.childNodes);
        });
        return this;
    }

    public generateSvg() {
        const drawRect = (
            x: number,
            y: number,
            width: number,
            height: number,
            fillColor: string
        ) => {
            const fill = fillColor;
            const rect = `<rect x="${x}" y="${y}" width="${width}" height="${height}" fill="${fill}" />`;
            return rect;
        };

        const drawLine = (x: number, y: number, dx: number, color: string) => {
            if (Math.abs(dx) < 0) return ""

            const x1 = x * this.options.fontSize + this.options.margin;
            const x2 = x1 + dx * this.options.fontSize;
            const y1 = y * this.options.leading + this.options.margin;
            const y2 = y1;

            const offset =
                x > 0 ? this.options.fontSize / 2 : (this.options.fontSize / 2) * -1;
            const strokeAttr = color ? `stroke="${color}" ` : "";

            return `   <line x1="${x1 + offset}" y1="${y1}" x2="${
                x2 - offset
                }" y2="${y2}" ${strokeAttr}/>`;
        };

        const splitAndTrim = (text: string) => {
            interface Segment {
                start: number; text?: string
            }

            const output: Segment[] = [];
            const { length } = text;
            let segment:
                | Segment
                | undefined;

            range(text.length + 1).forEach(i => {
                const char = text[i]
                let reset = false
                if (!segment && char !== " ") {
                    segment = { start: i };
                    reset = true
                }
                if (segment && !reset) {
                    if (char === " " || i === length) {
                        segment.text = text.slice(segment.start, i);
                        output.push(segment);
                        segment = undefined;
                    }
                }
            })

            return output;
        };

        const createCodeLine = (
            line: Array<Node>,
            y: number,
            indent: number = 0
        ): string => {
            return line
                .map(
                    (element: {
                        nodeName: string;
                        textContent: string;
                        className: string | undefined;
                        childNodes: any;
                    }) => {
                        const { nodeName, textContent, className, childNodes } = element;
                        if (textContent === "\n") return "";
                        if (childNodes.length > 1) {
                            const tmp = createCodeLine(Array.from(childNodes), y, indent);
                            indent += textContent.length;
                            return tmp;
                        }
                        const color =
                            nodeName === "SPAN" && this.options.theme[`.${className}`]
                                ? this.options.theme[`.${className}`].color
                                : this.options.theme[`.hljs`].color;
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
                .reduce(
                    (a: Array<string>, b: Array<string> | string) => a.concat(b),
                    []
                )
                .join("\n");
        };

        const createLineNumbers = () => {
            const color = this.options.theme[`.hljs`].color;

            const startG = `  <g class="line numbers" stroke="${color}" stroke-linecap="${this.options.lineCap}" stroke-width="${this.options.fontSize}">\n`;
            const body = range(this.highlightedLines.length)
                .map(y => {
                    const width = (y + 1).toString().length; // # of digits in line number
                    return drawLine(this.options.lineNumberOffset, y, -width, color);
                })
                .join('\n');
            const endG = "  </g>\n";

            return startG + body + endG;
        };

        const getHeight = () => {
            return (
                (this.highlightedLines.length - 1) * this.options.leading +
                this.options.margin * 2
            );
        };

        const getWidth = () => {
            const linesLength = this.highlightedLines.map((line): number => {
                const lineLength = line.reduce(
                    (sum, node) => sum + node.textContent.length,
                    0
                );

                return lineLength;
            });

            const maxLength = Math.max(...linesLength);
            return maxLength * this.options.fontSize + this.options.margin * 2;
        };

        const height = getHeight();
        const width = getWidth();

        const startSvg = `<svg class="faux code" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">\n`;
        const endSvg = "</svg>";
        const background = drawRect(
            0,
            0,
            width,
            height,
            this.options.theme[`.hljs`].background
        );

        const startG = `<g class="code block" stroke-linecap="${this.options.lineCap}" stroke-width="${this.options.fontSize}">\n`;
        const endG = "</g>\n";
        const innerCodeBlock = this.highlightedLines
            .map((line, index) => {
                return startG + createCodeLine(line, index) + endG;
            })
            .join("\n");

        const lineNumbers = this.options.lineNumbers ? createLineNumbers() : "";
        const codeBlock = startG + innerCodeBlock + endG;
        return startSvg + background + codeBlock + lineNumbers + endSvg;
    }
}

export { GeneratorOptions, getDefaultOptions, Generator };
