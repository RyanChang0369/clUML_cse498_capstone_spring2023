import {Component} from "../Component";
import {Rect} from "../Utility/Rect";
import {PaletteImage} from "../Graphics/PaletteImage";
import {AddPopup} from "../UI/AddPopup";
import Vector from "../Utility/Vector";
import {ClassName} from "../SanityElement/ClassName";
import Selectable, {ITALICS_FONT, NAME_FONT} from "../Selectable";
import {ClassPropertiesDlg} from "../Dlg/ClassPropertiesDlg";
import Unique from "../Utility/Unique";
import {SanityElement} from "../SanityElement/SanityElement";
import {Operation} from "../SanityElement/Operation";
import {TextInput} from "../Input/TextInput";
import {Attribute} from "../SanityElement/Attribute";

export const Class = function () {
    Component.call(this);

    this.forwardSanityCheck = function* () {
        // yield this.className;
        yield* this.attributes;
        yield* this.operations;
    }

    /**
     * Component height.
     * @type {number}
     */
    Object.defineProperty(this, 'height', {
        get: function () {
            return this.nameHeight + this.attributesHeight + this.operationsHeight;
        }
    })

    Object.defineProperty(this, 'width', {
        get: function () {
            let widest = this.className.minBounds().width;

            for (const element of [...this.attributes, ...this.operations]) {
                const w = element.minBounds().width;
                if (widest < w) {
                    widest = w;
                }
            }

            return Math.max(200, widest + 5);
        }
    })



    Object.defineProperty(this, 'size', {
        get: function () {
            return new Vector(this.width, this.height);
        }
    })

    this.className = new ClassName("Class1", this);

    /**
     * The array of attributes.
     * @type{Array<Attribute>}
     */
    this.attributes = [new Attribute('+attribute1 : type', this)];

    /**
     * The array of operations.
     * @type{Array<Operation>}
     */
    this.operations = [new Operation('+operation1(param : type) : returnType', this)];

    this.addPopup = null;

    /**
     * The editing popup for this class when editing the class
     */
    this.editingPopup = null;

    /**
     * Attached termination nodes.
     * @type {TerminationNode[]}
     */
    this.attachedTNodes = [];

    //this doesn't actually control font its just what it seemed to be hardcoded into
    this.fontHeight = 14;

    this.abstract = false;

    /**
     * The x-value of the mouse the last time this class was selected
     * @type {number}
     */
    this.lastSelectedX = 0;

    /**
     * The y-value of the mouse the last time this class was selected
     * @type {number}
     */
    this.lastSelectedY = 0;

    Object.defineProperty(this, 'lineHeight', {
        get: function () {
            return this.fontHeight * 1.5;
        }
    });

    Object.defineProperty(this, 'nameHeight', {
        get: function () {
            return this.fontHeight * 2.5;
        }
    });

    Object.defineProperty(this, 'nameBounds', {
        get: function () {
            return Rect.fromTopAndSize(
                new Vector(this.x, this.y),
                new Vector(this.width, this.nameHeight)
            )
        }
    });

    Object.defineProperty(this, 'attributesHeight', {
        get: function () {
            return this.lineHeight * this.attributes.length;
        }
    });

    Object.defineProperty(this, 'attributesBounds', {
        get: function () {
            return Rect.fromTopAndSize(
                new Vector(this.x, this.y + this.nameHeight),
                new Vector(this.width, this.attributesHeight)
            )
        }
    });

    Object.defineProperty(this, 'operationsHeight', {
        get: function () {
            return this.lineHeight * this.operations.length;
        }
    });

    Object.defineProperty(this, 'operationsBounds', {
        get: function () {
            return Rect.fromTopAndSize(
                new Vector(this.x, this.y + this.nameHeight + this.attributesHeight),
                new Vector(this.width, this.operationsHeight)
            )
        }
    });
}

Class.prototype = Object.create(Component.prototype);
Class.prototype.constructor = Class;


Class.prototype.fileLbl = "Class";
Class.prototype.helpLbl = 'class';
Class.prototype.paletteLbl = "Class";
Class.prototype.paletteDesc = "Class component.";
Class.prototype.htmlDesc = '<h2>Class</h2><p>A basic class.</p>';
Class.prototype.paletteOrder = 1;

/**
 * Gets the bounds of the nth operation.
 * @param n {number}
 * @return {Rect}
 */
Class.prototype.boundsOfNthOperation = function (n) {
    const topStart = this.y + this.nameHeight + this.attributesHeight;
    return Rect.fromTopAndSize(
        new Vector(this.x, topStart + this.lineHeight * n),
        new Vector(this.width, this.lineHeight)
    );
}

/**
 * Returns the bounds of the specified operation.
 * @param operation {Operation}
 * @return {Rect}
 */
Class.prototype.boundsOfOperation = function (operation) {
    return this.boundsOfNthOperation(this.operations.indexOf(operation));
}

/**
 * Gets the bounds of the nth attribute.
 * @param n {number}
 * @return {Rect}
 */
Class.prototype.boundsOfNthAttribute = function (n) {
    const topStart = this.y + this.nameHeight;
    return Rect.fromTopAndSize(
        new Vector(this.x, topStart + this.lineHeight * n),
        new Vector(this.width, this.lineHeight)
    );
}

/**
 * Returns the bounds of the specified attribute.
 * @param attribute {Attribute}
 * @return {Rect}
 */
Class.prototype.boundsOfAttribute = function (attribute) {
    return this.boundsOfNthAttribute(this.attributes.indexOf(attribute));
}

/**
 * Copies from another component.
 * @param component {Class}
 */
Class.prototype.copyFrom = function (component) {
    this.className = component.className;
    this.operations = component.operations;
    this.attributes = component.attributes;
    Component.prototype.copyFrom.call(this, component);
}

/**
 * Try to touch this component or some part of
 * the component.
 * @param x {number} Mouse x.
 * @param y {number} Mouse y.
 * @return {Class|null}
 */
Class.prototype.touch = function (x, y) {
    // Have we touched the component itself?
    if (this.bounds().contains(x, y)) {
        return this;
    }
    return null;
}

Class.prototype.move = function (dx, dy, x, y) {
    Component.prototype.move.call(this, dx, dy, x, y);

    for (const node of this.attachedTNodes) {
        node.move(dx, dy, x, y);
    }
}

Class.prototype.doubleClick = function (x, y) {
    Selectable.prototype.doubleClick.call(this, x, y);

    const nTxtIn = TextInput.createFromMouseClick(x, y, this.className, undefined);
    if (nTxtIn !== undefined) {
        nTxtIn.inputElement.style.textAlign = 'center';
        return;
    }

    for (const attribute of this.attributes) {
        const txtIn = TextInput.createFromMouseClick(x, y, attribute, undefined);
        if (txtIn !== undefined) {
            return;
        }
    }

    for (const operation of this.operations) {
        const txtIn = TextInput.createFromMouseClick(x, y, operation, undefined);
        if (txtIn !== undefined) {
            return;
        }
    }

    // Name/attributes/operation was not selected.
    this.openProperties();

    //this.enableAddPopup(true);
}

Class.prototype.openProperties = function () {
    const propertiesDlg = new ClassPropertiesDlg(this, this.main);
    propertiesDlg.open();
}

Class.prototype.tryTouchAddPopup = function (x, y) {
    if (this.addPopup != null) {
        return this.addPopup.touch(x, y);
    }
    return null;
}

Class.prototype.tryTouchEditingPopup = function (x, y) {
    if (this.editingPopup != null) {
        let newText = this.editingPopup.touch(x, y);
        // Only update the text field if the user enters something
        if (newText !== "") {
            // Editing the name field
            if (this.editingPopup.editingWhat === "name") {
                this.naming = newText
            }
            // Editing an attribute field
            else if (this.editingPopup.editingWhat === "attribute") {
                // Determine what attribute needs to be changed first, then change it
                let boxHeight = this.attributesHeight / this.attributes.length;
                let selectedAttributeNumber = Math.floor((this.lastSelectedY
                    - this.attributesBounds.bottom) / boxHeight)
                this.attributes[selectedAttributeNumber].name = newText
            }
            // Editing an operation field
            else if (this.editingPopup.editingWhat === "operation") {
                // Determine what operation needs to be changed first, then change it
                let boxHeight = this.operationsHeight / this.operations.length;
                let selectedOperationNumber = Math.floor((this.lastSelectedY
                    - this.operationsBounds.bottom) / boxHeight)
                this.operations[selectedOperationNumber] = newText
            }
        }
    }
    return null;
}
/**
 * Returns the bounds of the Class, used to ensure the
 * object remains on screen.
 * @return {Rect}
 */
Class.prototype.bounds = function () {
    return Rect.fromTopAndSize(
        this.position, this.size
    );
}

Class.prototype.enableAddPopup = function (enable) {
    if (enable) {
        this.addPopup = new AddPopup(this);
    } else {
        this.addPopup = null;
    }
}

Class.prototype.enableEditing = function (enable) {
    // if (enable) {
    //     this.editingPopup = new EditingPopup(this);
    // } else {
    //     this.editingPopup = null;
    // }
}

/**
 * Draws the class object.
 *
 * @param context {CanvasRenderingContext2D} Display context
 * @param view {View} View object
 */
Class.prototype.draw = function (context, view) {
    this.selectStyle(context, view);

    context.beginPath();
    context.fillStyle = "#e7e8b0";
    context.strokeStyle = "#000000";

    // Class Name rect
    this.nameBounds.contextRect(context);

    // Attribute rect
    this.attributesBounds.contextRect(context);

    // Operations rect
    this.operationsBounds.contextRect(context);


    context.fill();
    context.stroke();

    // Defaults the name to ClassName: UniqueName if no name is given
    if (this.naming == null) {
        this.naming = "ClassName:" + Unique.uniqueName();
    }


    // Naming text
    context.fillStyle = "#000000";
    if (this.abstract) {
        this.className.font = ITALICS_FONT;
    } else {
        this.className.font = NAME_FONT;
    }

    this.className.position = new Vector(0, this.lineHeight / 2);
    this.className.draw(context, view);

    context.textAlign = "left"
    context.font = NAME_FONT;
    // boolean to check if attributes/operations' visibility should be drawn
    const visibility = this.diagram.diagrams.model.main.options.showVisibility;

    // Attributes text
    let fromTop = this.nameHeight - this.lineHeight / 2;
    for (let i = 0; i < this.attributes.length; i++) {
        const attribute = this.attributes[i];
        attribute.textAlign = 'left';
        attribute.position = new Vector(-this.width / 4, fromTop + i * this.lineHeight / 2);
        attribute.draw(context, view);
    }

    // Operations text
    fromTop += this.attributesHeight - this.lineHeight / 2;
    for (let j = 0; j < this.operations.length; j++) {
        const operation = this.operations[j];
        operation.textAlign = 'left';
        operation.position = new Vector(-this.width / 4, fromTop + j * this.lineHeight / 2);
        operation.draw(context, view);
    }

    if (this.addPopup != null) {
        this.addPopup.draw(context, view, this.x, this.y);
    }

    if (this.editingPopup != null) {
        // name box
        if (this.lastSelectedY < this.attributesBounds.bottom) {
            this.editingPopup.drawNameEdit(context, view, this.nameBounds,
                this.width, this.nameHeight, this.naming);
        }
        // attribute box
        else if (this.lastSelectedY < this.operationsBounds.bottom) {
            let boxHeight = this.attributesHeight / this.attributes.length;
            let selectedAttributeNumber = Math.floor((this.lastSelectedY
                - this.attributesBounds.bottom) / boxHeight)
            let selectedAttributeHeight = this.attributesBounds.bottom
                + (selectedAttributeNumber * boxHeight)
            this.editingPopup.drawAttributionEdit(context,
                view,
                this.x - this.width / 2,
                selectedAttributeHeight,
                this.width,
                boxHeight,
                "attribute",
                this.attributes[selectedAttributeNumber].name);
        }
        // operation box
        else if (this.lastSelectedY < this.operationsBounds.top) {
            let boxHeight = this.operationsHeight / this.operations.length;
            let selectedOperationNumber = Math.floor((this.lastSelectedY
                - this.operationsBounds.bottom) / boxHeight)
            let selectedOperationHeight = this.operationsBounds.bottom
                + (selectedOperationNumber * boxHeight)
            this.editingPopup.drawAttributionEdit(context,
                view,
                this.x - this.width / 2,
                selectedOperationHeight,
                this.width,
                boxHeight,
                "operation",
                this.operations[selectedOperationNumber]);
        }
    }

    Component.prototype.draw.call(this, context, view);
}

Class.prototype.saveComponent = function () {
    const obj = Component.prototype.saveComponent.call(this);
    obj.className = this.className.saveSanityElement();
    obj.attributes = SanityElement.saveMultiple(this.attributes);
    obj.operations = SanityElement.saveMultiple(this.operations);
    return obj;
}

Class.prototype.loadComponent = function (obj) {
    Component.prototype.loadComponent.call(this, obj);

    this.className = SanityElement.loadSanityElement(ClassName, obj.className, this);
    this.attributes = SanityElement.loadMultiple(Attribute, 'attributes', obj, this);
    this.operations = SanityElement.loadMultiple(Operation, 'operations', obj, this);
}

/**
 * Makes sure this component is at least partially within the bounds of screen.
 */
Class.prototype.drop = function () {
    if (this.x < this.width / 2) {
        this.x = this.width / 2;
    }

    if (this.y < 0) {
        this.y = 0;
    }
};

/**
 * Create a PaletteImage object for the component
 * @returns {PaletteImage}
 */
Class.prototype.paletteImage = function () {
    // let size=16;  // Box size
    let width = 60;       // Image width
    let height = 40;      // Image height

    const pi = new PaletteImage(width, height);

    pi.box(40, 30);
    pi.fillStroke("#e7e8b0");
    pi.box(40, 15);
    pi.fillStroke("#e7e8b0");

    return pi;
}

/**
 * Add an attribute to this Class
 */
Class.prototype.addAttribute = function (attribute) {
    this.attributes.push(attribute)
}

/**
 * Edit an existing attribute in the class
 */
Class.prototype.editAttribute = function (attributeIndex, newAttribute) {
    this.attributes[attributeIndex] = newAttribute
}

/**
 * Add an operation to this Class
 */
Class.prototype.addOperation = function (operation) {
    this.operations.push(operation)
}

/**
 * Edit an existing operation in the class
 */
Class.prototype.editOperation = function (operationIndex, newOperation) {
    this.attributes[operationIndex] = newOperation
}
