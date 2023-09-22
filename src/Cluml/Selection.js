import {Rect} from './Utility/Rect';

/**
 * The Selection object keeps track of what is currently
 * selected in a view.
 * @param view {View} The view this selected object is associated with
 * @constructor
 */
export const Selection = function (view) {

    /**
     * Maintains a list of the currently selected components.
     * @type {Component[]}
     */
    this.selected = [];

    let down = false;
    let firstMove = false;

    /**
     * Rectangle for selected
     * @type {Rect}
     */
    let rect = null;

    this.rightClick = function(x, y,  event) {
        const touched = view.diagram.touch(x, y);
        if (touched !== null) {
            if (touched.paletteLbl == "Class")
            {
                event.preventDefault();
                this.selected = [touched];
                this.selected[0].enableAddPopup(true);
            }
        }
        else {
            // If we touch outside, we are clearing the selected if
            // shift is not selected, and we start a selected rectangle
            if (!event.shiftKey) {
                this.selected = [];
            }

            rect = new Rect(x, y, x, y);
        }
    }

    this.doubleTap = function(x,y, event)
    {
        const touched = view.diagram.touch(x, y);
        if (touched !== null) {
            if (touched.paletteLbl == "Class")
            {
                event.preventDefault();
                this.selected = [touched];
                this.selected[0].enableAddPopup(true);
            }
        }
    }

    this.mouseDown = function (x, y, event) {
        down = true;
        firstMove = true;

        if (event.touches != null) {
            if (event.touches.length == 2) {
                down = true;
            }
        }

        if (this.selected[0] != null)
        {
            // Last mouse down (right-click) was on a class
            if (this.selected[0].paletteLbl == "Class")
            {
                this.selected[0].tryTouchAddPopup(x,y);
                this.selected[0].enableAddPopup(false);
            }
        }

        /**
         * @type {Component}
         */
        const touched = view.diagram.touch(x, y);
        if (touched !== null) {
            // Some selectables are singles, meaning we can
            // only select one at a time.
            if (touched.single()) {
                this.selected = [touched];
            } else {
                // If we touched something that was not
                // previously selected, it becomes the selected
                if (!this.isSelected(touched)) {
                    if (!event.shiftKey) {
                        this.selected = [];
                    }

                    this.selected.push(touched);
                }
            }

        } else {
            // If we touch outside, we are clearing the selected if
            // shift is not selected, and we start a selected rectangle
            if (!event.shiftKey) {
                this.selected = [];
            }

            rect = new Rect(x, y, x, y);
        }

        for (let i = 0; i < this.selected.length; i++) {
            this.selected[i].grab();
        }
    };

    this.mouseMove = function (x, y, dx, dy) {
        if (down) {
            if (firstMove) {
                // If we move the mouse the first time on any
                // selected, we need to create an undo backup
                if (rect === null && this.selected.length > 0) {
                    view.model.backup();
                }

                // This is the first movement of the mouse
                // after we clicked. If there is one and only
                // one item selected, check to see if it is
                // something that might spawn a new child that
                // we drag. This is how bending points are implemented.
                if (this.selected.length === 1) {
                    const spawned = this.selected[0].spawn(x, y);
                    if (spawned !== null) {
                        this.selected = [spawned];
                    }
                }

                firstMove = false;
            }

            if (rect !== null) {
                rect.setRightBottom(x, y);
            } else {
                for (let i = 0; i < this.selected.length; i++) {
                    this.selected[i].move(dx, dy, x, y);
                }
            }

            view.model.update(view.diagram);
        }
    };

    this.mouseUp = function (x, y) {
        if (down) {
            let clear = false;
            for (let i = 0; i < this.selected.length; i++) {
                if (this.selected[i].single()) {
                    clear = true;
                }
                this.selected[i].drop();
            }

            if (clear) {
                this.selected = [];
            }
        }
        down = false;

        if (rect !== null) {
            selectRect();
            rect = null;
        }

        view.diagram.mouseUp();
    };

    const selectRect = () => {
        rect.normalize();
        if (!rect.isEmpty()) {
            const inRect = view.diagram.inRect(rect);
            if (inRect.length > 0) {
                const newSelection = this.selected.slice();
                for (let i = 0; i < inRect.length; i++) {
                    if (!this.isSelected(inRect[i])) {
                        newSelection.push(inRect[i]);
                    }
                }

                this.selected = newSelection;
            }
        }
    }

    /**
     * Is this component currently selected?
     * @param component Component to test
     * @returns {boolean} true if selected.
     */
    this.isSelected = function (component) {
        for (let i = 0; i < this.selected.length; i++) {
            if (component === this.selected[i]) {
                return true;
            }
        }

        return false;
    };

    this.draw = function (context) {
        if (rect !== null) {
            if (!context.setLineDash) {
                context.setLineDash = function () {
                }
            }

            context.strokeStyle = "#888888";
            context.setLineDash([2, 3]);
            context.beginPath();
            context.rect(rect.left, rect.top, rect.right - rect.left, rect.bottom - rect.top);
            context.stroke();
            context.setLineDash([]);
        }

    };

    this.getSelection = function () {
        return this.selected;
    };

    this.clear = function () {
        this.selected = [];
    }
};

/**
 * Delete everything that is selected.
 */
Selection.prototype.delete = function () {
    this.selected.forEach(function (selectable) {
        selectable.delete();
    });
    this.clear();
};

export default Selection;

