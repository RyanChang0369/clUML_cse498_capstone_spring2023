import {Component} from "../../Component";
import {TerminationNode} from "./TerminationNode";
import {Rect} from "../../Utility/Rect";
import {LineNode, NODE_TOUCH_RADIUS} from "./LineNode";
import Vector from "../../Utility/Vector";
import {Line} from "../../Utility/Line";
import {MainSingleton} from "../../MainSingleton";

export const ASSOCIATION_MIN_NODE_CREATE_DISTANCE = 25;

export const Association = function () {
    Component.call(this);

    /**
     *
     * @return {Generator<SanityElement, void, *>}
     */
    this.forwardSanityCheck = function* () {
        if (this.nodes !== undefined) {
            if (this.nodes.start !== null) {
                yield this.nodes.start.multiplicityValue;
            }

            if (this.nodes.end !== null) {
                yield this.nodes.end.multiplicityValue;
            }
        }
    }
}

class NodeData {
    /**
     * The start node of this association.
     * @type {TerminationNode}
     */
    #start = null;

    /**
     * The end node of this association.
     * @type {TerminationNode}
     */
    #end = null;

    /**
     *
     * @type {Association}
     */
    #association = undefined;

    get start() {
        return this.#start;
    }

    get end() {
        return this.#end;
    }

    //region Constructor
    /**
     * Instantiates the start and end nodes.
     * @param association {Association}
     */
    constructor(association) {
        const pos = association.position;
        this.#start = new TerminationNode();
        this.#start.position = new Vector(pos.x - 50, pos.y);
        this.#end = new TerminationNode();
        this.#end.position = new Vector(pos.x + 50, pos.y);
        this.#start.linkToNext(this.#end);
        this.link(association);
    }

    /**
     * Links start and end nodes with the association.
     * @param association {Association}
     */
    link(association) {
        this.#association = association;
        this.start.association = association;
        this.end.association = association;
    }
    //endregion

    saveNodeData() {
        return this.#start.saveNode();
    }

    loadNodeData(obj, association) {
        let node = new TerminationNode();
        let nData = obj;
        node.loadNode(nData, association);
        this.#start = node;

        while (node.hasNext) {
            nData = nData.next;
            node = node.nextNode;
            node.loadNode(nData, association);
        }

        this.#end = node;
    }

    // /**
    //  * Copies the values in "other".
    //  * @param other {NodeData}
    //  */
    // copyFrom(other) {
    //     this.#start.id = other.#start.id;
    //     this.#end.id = other.#end.id;
    // }
}

Association.prototype = Object.create(Component.prototype);
Association.prototype.constructor = Association;

//region Type
Association.prototype.fileLbl = "Association";
Association.prototype.helpLbl = 'association';
Association.prototype.paletteLbl = "Association";
Association.prototype.paletteDesc = "Association component.";
Association.prototype.htmlDesc = '<h2>Association</h2><p>A basic association between 2 classes.</p>';
Association.prototype.paletteOrder = 20;
//endregion

//region Component Methods
Association.prototype.drop = function () {
    Component.prototype.drop.call(this);

    /**
     *
     * @type {NodeData}
     */
    this.nodes = new NodeData(this);
}

/**
 * Clones this association.
 * @return {Component}
 */
Association.prototype.clone = function () {
    this.serializedNodeData = this.nodes.saveNodeData();

    return Component.prototype.clone.call(this);
}

/**
 * Copies from another Association.
 * @param component {Association}
 */
Association.prototype.copyFrom = function (component) {
    // this.nodes.copyFrom(component.nodes);
    this.serializedNodeData = component.serializedNodeData;
    Component.prototype.copyFrom.call(this, component);
}

Association.prototype.onUndo = function () {
    this.nodes = new NodeData(this);
    this.nodes.loadNodeData(this.serializedNodeData, this);
}

/**
 * Try to touch this component or some part of
 * the component.
 * @param x {number} Mouse x.
 * @param y {number} Mouse y.
 * @return {LineNode|null}
 */
Association.prototype.touch = function (x, y) {
    // Have we touched the component itself?
    if (this.bounds().contains(x, y)) {
        // Return a node instead of the association itself.
        for (const node of this.nodeGenerator()) {
            if (node.touch(x, y) !== null) {
                return node;
            }
        }

        // No node found. Create a new node.
        return this.createNodeNear(new Vector(x, y));
    }

    return null;
}

// Association.prototype.move = function (dx, dy) {
//     Selectable.prototype.move.call(this, dx, dy);
//
//     let node = this.nodes.start;
//
//     do {
//         node.x += dx;
//         node.y += dy;
//         node = node.nextNode;
//     } while (node !== null);
// }

/**
 * Returns the largest bounds this association displaces.
 * @return {Rect}
 */
Association.prototype.bounds = function () {
    if (this.placedOnCanvas) {
        let min = this.nodes.start.bounds().max;
        let max = this.nodes.start.bounds().min;

        for (const node of this.nodeGenerator()) {
            max = Vector.maxComponents(
                max,
                node.bounds().max
            );
            min = Vector.minComponents(
                min,
                node.bounds().min
            )
        }

        return Rect.fromMinAndMax(
            min, max
        );
    } else {
        return new Rect(0, 0, 0, 0);
    }
}

/**
 * Draw an association object.
 *
 * @param context {CanvasRenderingContext2D} Display context
 * @param view {View} View object
 */
Association.prototype.draw = function (context, view) {
    Component.prototype.draw.call(this, context, view);

    // const testNodes = [...this.nodeGenerator()];

    this.selectStyle(context, view);

    // Draw the line.
    context.beginPath();
    context.strokeStyle = "#000000";

    this.nodes.start.draw(context, view);

    for (const edge of this.edgeGenerator()) {
        context.moveTo(edge.from.x, edge.from.y);
        context.lineTo(edge.to.x, edge.to.y);

        edge.to.draw(context, view);
    }

    // context.rect(
    //     this.x, this.y,
    //     100, 100
    // );

    // context.moveTo(this.nodes.start.x, this.nodes.start.y);
    // context.lineTo(this.nodes.end.x, this.nodes.end.y);
    context.fill();
    context.stroke();
}

Association.prototype.saveComponent = function () {
    const obj = Component.prototype.saveComponent.call(this);
    obj.nodeData = this.nodes.saveNodeData();
    return obj;
}

Association.prototype.loadComponent = function (obj) {
    Component.prototype.loadComponent(obj);
    this.nodes.loadNodeData(obj, this);

    // this.nodes.loadFromIDs(this.diagram, obj.startNodeID, obj.endNodeID);
}

// /**
//  * Call the termination node to draw the PaletteItem to the palette
//  * @returns {PaletteImage}
//  */
// Association.prototype.paletteImage = function () {
//     return this.nodes.end.paletteImage();
// }

//endregion

//region Association Methods.
/**
 * A generator that generates (iterates) all the nodes of the association.
 * @return {Generator<LineNode, void, *>}
 */
Association.prototype.nodeGenerator = function* () {
    let node = this.nodes.start;

    while (node !== null) {
        const next = node.nextNode;
        yield node;
        node = next;
    }
}

/**
 * A generator that generates (iterates) all the edges of the association.
 * @return {Generator<{from: LineNode, to: LineNode}, void, *>}
 */
Association.prototype.edgeGenerator = function* () {
    let node = this.nodes.start;

    while (node !== this.nodes.end) {
        yield {
            from: node,
            to: node.nextNode
        };
        node = node.nextNode;
    }
}

/**
 * Creates a node line node near the point "near".
 * @param near {Vector}
 * @return {LineNode|null}
 */
Association.prototype.createNodeNear = function (near) {
    /**
     * @type {{t: number, distance: number, pointOnLine: Vector}}
     */
    let minTDP = undefined;
    let minEdge = undefined;

    for (const edge of this.edgeGenerator()) {
        const line = new Line(edge.from.position, edge.to.position);
        const tdp = line.pointNearest(near);

        if (tdp.distance < ASSOCIATION_MIN_NODE_CREATE_DISTANCE) {
            if (minTDP === undefined || tdp.distance < minTDP.distance) {
                minTDP = tdp;
                minEdge = edge;
            }
        }
    }

    if (minTDP !== undefined) {
        // Now have the nearest point on the line.
        // First do backup.
        MainSingleton.singleton.backup();

        const newNode = new LineNode();
        newNode.position = minTDP.pointOnLine;
        newNode.insertBetween(minEdge.from, minEdge.to);

        return newNode;
    } else {
        return null;
    }
}
//endregion
