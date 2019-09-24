import EventEmitter from '../utils/EventEmitter'
import {
    fnBind, 
    getTouchEvent
} from '../utils/utils'


export default class TabDragListener extends EventEmitter {
    constructor(eElement, nButtonCode, bvState) {

        super();

        this._timeout = null
        this.bvState = bvState;
        console.log(this.bvState);

        this._eElement = $(eElement);
        this._oDocument = $(document);
        this._eBody = $(document.body);
        this._nButtonCode = nButtonCode || 0;

        /**
         * The delay after which to start the drag in milliseconds - CHANGED FROM 200ms
         */
        this._nDelay = 100;

        /**
         * The distance the mouse needs to be moved to qualify as a drag
         */
        this._nDistance = 1; //TODO - works better with delay only

        this._nX = 0;
        this._nY = 0;

        this._nOriginalX = 0;
        this._nOriginalY = 0;

        this._bDragging = false;
        
        this._fDown = fnBind(this.onMouseDown, this);
        this._fMove = fnBind(this.onMouseMove, this);
        this._fUp = fnBind(this.onMouseUp, this);

        // this._eElement.on('mousedown touchstart', this._fDown);
        this._eElement.attr('draggable', true);
        this._eElement.on('dragstart', this._fDown);
        this._eElement.on('drag', this._fMove);
        this._eElement.on('dragend', this._fUp);
    }

    destroy() {
        // this._eElement.unbind('mousedown touchstart', this._fDown);
        // this._oDocument.unbind('mouseup touchend', this._fUp);
        this._eElement.unbind('dragstart', this._fDown);
        this._eElement.unbind('drag', this._fMove);
        this._eElement.unbind('dragend', this._fUp);
        this._eElement = null;
        this._oDocument = null;
        this._eBody = null;
    }

    onMouseDown(oEvent) {
        // oEvent.preventDefault();

        // if (oEvent.button == 0 || oEvent.type === "touchstart") {
            var coordinates = this._getCoordinates(oEvent);
            console.log(oEvent)
            // ADD DATA TO THE DRAGEVENT
            if(this.bvState) {
                console.log('in bv identity')
                let winIdentity = fin.Window.getCurrentSync().identity;
                
                const identityString = `${JSON.stringify(this.bvState)}*****${winIdentity.uuid}*****${winIdentity.name}`;
                // const fin = fin || false;
                // if (fin) {
                //     const winId = fin.Window.getCurrentSync().identity;
                //     identity = winId.uuid + '/' + winId.name;
                // }
                oEvent.originalEvent.dataTransfer.effectAllowed = 'move';
                oEvent.originalEvent.dataTransfer.setData('Text', identityString);
    
            }
            
            this._nOriginalX = coordinates.x;
            this._nOriginalY = coordinates.y;

            // this._oDocument.on('mousemove touchmove', this._fMove);
            // this._oDocument.one('mouseup touchend', this._fUp);

            this._timeout = setTimeout(fnBind(() => this._startDrag(oEvent), this), this._nDelay);
        // }
    }

    onMouseMove(oEvent) {
        // console.log('drag event');
        // if (this._timeout != null) {
            // oEvent.preventDefault();

            var coordinates = this._getCoordinates(oEvent);

            this._nX = coordinates.x - this._nOriginalX;
            this._nY = coordinates.y - this._nOriginalY;

            if (this._bDragging === false) {
                if (
                    Math.abs(this._nX) > this._nDistance ||
                    Math.abs(this._nY) > this._nDistance
                ) {
                    clearTimeout(this._timeout);
                    this._startDrag(oEvent);
                }
            }

            if (this._bDragging) {
                this.emit('drag', this._nX, this._nY, oEvent);
            }
        // }
    }

    onMouseUp(oEvent) {
        // if (this._timeout != null) {
            clearTimeout(this._timeout)
            setTimeout(() => {
                this._eBody.removeClass('lm_dragging');
                this._eElement.removeClass('lm_dragging');
                this._oDocument.find('iframe').css('pointer-events', '');
                // this._oDocument.unbind('mousemove touchmove', this._fMove);
                // this._oDocument.unbind('mouseup touchend', this._fUp);
            },10);
            if (this._bDragging === true) {
                this._bDragging = false;
                setTimeout(() => this.emit('dragStop', oEvent, this._nOriginalX + this._nX), 10);
            }
        // }
    }

    _startDrag(oEvent) {
        this._bDragging = true;
        this._eBody.addClass('lm_dragging');
        this._eElement.addClass('lm_dragging');
        this._oDocument.find('iframe').css('pointer-events', 'none');
        this.emit('dragStart', this._nOriginalX, this._nOriginalY);
        this.emit('drag', this._nOriginalX, this._nOriginalY, oEvent);
    }

    _getCoordinates(event) {
        event = getTouchEvent(event)
        return {
            x: event.pageX,
            y: event.pageY
        };
    }
}
