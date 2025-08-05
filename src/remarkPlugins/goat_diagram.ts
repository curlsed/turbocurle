import type {Code, Root} from "mdast";

import {visit} from 'unist-util-visit'

import { spawn } from "node:child_process";
import { text } from "node:stream/consumers";

async function ConvertGoatToSVG(code: string): Promise<string> {

    const task = spawn("./vendor/goat/bin/goat");
    task.stdin?.write(code, 'utf-8');

    task.stdin?.end(); // Close the stdin stream to indicate end of input
    let output = await text(task.stdout);
    return output;
}

/**
 * Turn gemoji shortcodes (`:+1:`) into emoji (`👍`).
 */
export default function goatDiagrams () {

    return async function (tree: Root) {
        let queue: {
            node: Code;
            parent: any;
            index: number;
        }[] = [];

        visit(tree, 'code', function (node: Code, index?: number, parent?: any) {
            if( node.lang !== 'goat') {
                return;
            }
            queue.push({
                node: node,
                parent: parent,
                index: index!
            });
        })

        for (const node of queue) {
            let svgString =
                    await ConvertGoatToSVG(node.node.value).catch((error) => {
                       console.error(`Error converting goat diagram to SVG: ${error}`);
                    })
            if (!svgString) {
                console.warn(`No SVG output for goat diagram at index ${node.index}`);
                continue;
            }

            // console.log(svgString);

            // Extract width and height from the SVG string
            const width = svgString.match(/width='(?<width>\d+)'/)?.groups?.width;
            const height = svgString.match(/height='(?<height>\d+)'/)?.groups?.height;

            // Add viewBox attribute if not present and remove width and height attributes
            if (!svgString.includes('viewBox=')) {
                svgString = svgString.replace(/<svg /, `<svg viewBox="0 0 ${width} ${height}" `);
            }
            svgString = svgString.replace(/width='\d+'/, '').replace(/height='\d+'/, '');

            console.log(`Goat diagram converted to SVG with width: ${width}, height: ${height}`);

            // const base64Image = btoa(svgString!);
            // const imgSrc = `data:image/svg+xml;base64,${base64Image}`;
            // Replace the code block with an HTML node containing the image
            const htmlNode: any = {
                type: 'html',
                value:
                    // `<img src="${imgSrc}" alt="Goat Diagram" class="goat-diagram" />`,
                    `<div class="goat-diagram">${svgString}</div>`,
            };

            // Replace the original code block with the HTML node
            node.parent.children.splice(node.index, 1, htmlNode);
        }
    }
}