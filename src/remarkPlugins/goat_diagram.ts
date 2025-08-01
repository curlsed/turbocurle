import type {Code, Nodes, Root} from "mdast";
import type {Plugin} from "unified";

import {visit} from 'unist-util-visit'

import { spawn } from "node:child_process";
import { text } from "node:stream/consumers";

async function ConvertGoatToSVG(code: string): Promise<string> {

    const task = spawn("/home/dpeter99/go/bin/goat");
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

        // console.log("goatDiagrams");
        // console.log(tree);

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

        // console.log("Found " + queue.length + " goat diagrams to convert to SVG");

        for (const node of queue) {
            const svgString =
                    await ConvertGoatToSVG(node.node.value).catch((error) => {
                       console.error(`Error converting goat diagram to SVG: ${error}`);
                    })
            // console.log(node);
            // console.log(`Converted goat diagram to SVG for node at index ${node.index}`);
            // console.log(svgString);

            const base64Image = btoa(svgString!);
            const imgSrc = `data:image/svg+xml;base64,${base64Image}`;
            // Replace the code block with an HTML node containing the image
            const htmlNode: any = {
                type: 'html',
                value: `<img src="${imgSrc}" alt="Goat Diagram" class="goat-diagram" />`,
                    // `<div class="goat-diagram">${svgString}</div>`,
            };

            // Replace the original code block with the HTML node
            node.parent.children.splice(node.index, 1, htmlNode);

            // console.log(`Replaced code block with SVG for goat diagram at index ${node.index}`);
        }
    }
}