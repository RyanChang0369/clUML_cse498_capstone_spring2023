
import {Rect} from './Utility/Rect';

/**
 * The Selection object keeps track of what is currently
 * selected in a view.
 * @param view The view this selection object is associated with
 * @constructor
 */
export const Selection = function(view) {

    /// Maintains a list of the currently selected components
    this.selection = [];

    let down = false;
    let firstMove = false;

    /// Rectangle for selection
    let rect = null;

    this.mouseDown = function(x, y, event) {
        down = true;
        firstMove = true;

        const touched = view.diagram.touch(x, y);
        if(touched !== null) {
            // Some selectables are singles, meaning we can
            // only select one at a time.
            if(touched.single()) {
                this.selection = [touched];
            } else {
                // If we touched something that was not
                // previously selected, it becomes the selection
                if(!this.isSelected(touched)) {
                    if(!event.shiftKey) {
                        this.selection = [];
                    }

                    this.selection.push(touched);
                }
            }

        } else {
            // If we touch outside, we are clearing the selection if
            // shift is not selected and we start a selection rectangle
            if(!event.shiftKey) {
                this.selection = [];
            }

            rect = new Rect(x, y, x, y);
        }

        for(let i=0; i<this.selection.length; i++) {
            this.selection[i].grab();
        }
    };

    this.mouseMove = function(x, y, dx, dy) {
        if(down) {
            if(firstMove) {
                // If we move the mouse the first time on any
                // selection, we need to create an undo backup
                if(rect === null && this.selection.length > 0) {
                    view.model.backup();
                }

                // This is the first movement of the mouse
                // after we clicked. If there is one and only
                // one item selected, check to see if it is
                // something that might spawn a new child that
                // we drag. This is how bending points are implemented.
                if(this.selection.length === 1) {
                    const spawned = this.selection[0].spawn(x, y);
                    if(spawned !== null) {
                        this.selection = [spawned];
                    }
                }

                firstMove = false;
            }

            if(rect !== null) {
                rect.setRightBottom(x, y);
            } else {
                for(let i=0; i<this.selection.length; i++) {
                    this.selection[i].move(dx, dy);
                }
            }

            //view.model.update(view.diagram);
        }
    };

    this.mouseUp = function(x, y) {
        if(down) {
            var clear = false;
            for(var i=0; i<this.selection.length; i++) {
                if(this.selection[i].single()) {
                    clear = true;
                }
                this.selection[i].drop();
            }

            if(clear) {
                this.selection = [];
            }
        }
        down = false;

        if(rect !== null) {
            selectRect();
            rect = null;
        }

        //view.diagram.mouseUp();
    };

    const selectRect = () => {
        rect.normalize();
        if(!rect.isEmpty()) {
            const inRect = view.diagram.inRect(rect);
            if(inRect.length > 0) {
                const newSelection = this.selection.slice();
                for (let i = 0; i < inRect.length; i++) {
                    if (!this.isSelected(inRect[i])) {
                        newSelection.push(inRect[i]);
                    }
                }

                this.selection = newSelection;
            }
        }
    }

    /**
     * Is this component currently selected?
     * @param component Component to test
     * @returns {boolean} true if selected.
     */
    this.isSelected = function(component) {
        for(let i=0; i<this.selection.length; i++) {
            if(component === this.selection[i]) {
                return true;
            }
        }

        return false;
    };

    this.draw = function(context) {
        if(rect !== null) {
            if (!context.setLineDash) {
                context.setLineDash = function () {}
            }

            context.strokeStyle = "#888888";
            context.setLineDash([2, 3]);
            context.beginPath();
            context.rect(rect.left, rect.top, rect.right - rect.left, rect.bottom - rect.top);
            context.stroke();
            context.setLineDash([]);
        }

    };

    this.getSelection = function() {
        return this.selection;
    };

    this.clear = function() {
        this.selection = [];
    }
};


export default Selection;

