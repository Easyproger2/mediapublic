import {Directive, ElementRef, EventEmitter, Input, Output} from '@angular/core';


const arrayToObject = (array, keyField) =>
    array.reduce((obj, item) => {
        obj[item[keyField]] = item;
        return obj;
    }, {});


@Directive({
    selector: '[appEasyFlipResize]',
    exportAs: 'appEasyFlipResize'
})

export class EasyFlipResizeDirective {
    private objectsPositionsX = [];
    private objectsPositionsY = [];
    private objectsPositionsCX = [];
    private objectsPositionsCY = [];
    private objectsPositionsEX = [];
    private objectsPositionsEY = [];
    private mapObjects = {};

    private isEnabled = false;

    @Input() easyFlipVLineStyle = {};
    @Input() easyFlipHLineStyle = {};

    @Input() easyFlipForce = 25;
    @Input() easyFlipWidthEditZone = 0;
    @Input() easyFlipHeightEditZone = 0;


    @Input() easyFlipSelfObjectID = '';
    @Input() easyFlipObjectsToFlip = [];
    @Output() easyFlipEnd = new EventEmitter<any>();

    private startedRect = {
        top: 0,
        left: 0,
        w: 0,
        h: 0
    };
    constructor(public element: ElementRef) {
    }


    private findClosestIn(searchVar, searchArray) {
        return searchArray.reduce(function(prev, curr) {
            return (Math.abs(curr.v - searchVar) < Math.abs(prev.v - searchVar) ? curr : prev);
        });
    }

    private findClosesByEdge(edge, itemsPos, itemsPosCenters, itemsPosEnd) {
        const p = this.findClosestIn(edge, itemsPos);
        const c = this.findClosestIn(edge, itemsPosCenters);
        const e = this.findClosestIn(edge, itemsPosEnd);

        p.dir = 1; // start
        c.dir = 2; // center
        e.dir = 3; // end

        const a = [p, c, e];
        return this.findClosestIn(edge, a);
    }

    private findFlipResult(pos, center, elementEnd, half, itemsPos, itemsPosCenters, itemsPosEnd, reverse = false) {

        const resultFlip = {
            dir: 0,
            objectID: 0,
            isFlip: false,
            v: 0,
            reverse: reverse
        };
        let flip = false;


        let findClosest = 0;

        const closestA = [];
        const closestElements = {};

        const closestR = this.findClosesByEdge(pos, itemsPos, itemsPosCenters, itemsPosEnd);

        if (Math.abs(pos - closestR.v ) < this.easyFlipForce && !reverse) {
            findClosest = reverse ? closestR.v : closestR.v;
            closestA.push({v: findClosest, i: 0});
            closestElements[0] = closestR;
            flip = true;
        }


        let findClosestC = 0;
        const closestRC = this.findClosesByEdge(center, itemsPos, itemsPosCenters, itemsPosEnd);
        const multiplier = reverse ? 2 : 2;
        if (Math.abs(center - closestRC.v) * multiplier < this.easyFlipForce ) {
            findClosestC = reverse ? (closestRC.v - pos) * 2 : closestRC.v - (elementEnd - closestRC.v) ;
            closestA.push({v: findClosestC, i: 1});
            closestElements[1] = closestRC;
            flip = true;
        }

        let findClosestE = 0;
        const closestRE = this.findClosesByEdge(elementEnd, itemsPos, itemsPosCenters, itemsPosEnd);
        if (Math.abs(elementEnd - closestRE.v) < this.easyFlipForce && reverse) {
            findClosestE = reverse ? closestRE.v - pos : closestRE.v - (half * 2);
            closestA.push({v: findClosestE, i: 2});
            closestElements[2] = closestRE;
            flip = true;
        }

        if (flip) {
            const r = this.findClosestIn(pos, closestA);
            pos = r.v;

            const aa = closestElements[r.i];
            resultFlip.isFlip = true;
            resultFlip.dir = aa.dir;
            resultFlip.objectID = aa.i;
        }

        resultFlip.v = pos;

        return resultFlip;
    }


    public easyFlipStartResize($event) {
        const startRect = {
            top:  $event.position.top,
            left: $event.position.left,
            w:    $event.size.width,
            h:    $event.size.height
        };
        this.startedRect = startRect;

        const containerObject = {
            ID: 0,
            x:  0,
            y:  0,
            w:  this.easyFlipWidthEditZone,
            h:  this.easyFlipHeightEditZone,
            cx: this.easyFlipWidthEditZone / 2,
            cy: this.easyFlipHeightEditZone / 2,
            ex: this.easyFlipWidthEditZone,
            ey: this.easyFlipHeightEditZone
        };

        const objectsFilteredSelf = this.easyFlipObjectsToFlip.filter((element) => {
            return element.ID !== this.easyFlipSelfObjectID && element.selected === false;
        });

        objectsFilteredSelf.push(containerObject);

        this.objectsPositionsX  = objectsFilteredSelf.map((obj) => {
            return {v: obj.x, i: obj.ID};
        }).sort( (a, b) => a.v - b.v);
        this.objectsPositionsY  = objectsFilteredSelf.map((obj) => {
            return {v: obj.y, i: obj.ID};
        }).sort( (a, b) => a.v - b.v);
        this.objectsPositionsCX = objectsFilteredSelf.map((obj) => {
            return {v: obj.cx, i: obj.ID};
        }).sort((a, b) => a.v - b.v);
        this.objectsPositionsCY = objectsFilteredSelf.map((obj) => {
            return {v: obj.cy, i: obj.ID};
        }).sort((a, b) => a.v - b.v);
        this.objectsPositionsEX = objectsFilteredSelf.map((obj) => {
            return {v: obj.ex, i: obj.ID};
        }).sort((a, b) => a.v - b.v);
        this.objectsPositionsEY = objectsFilteredSelf.map((obj) => {
            return {v: obj.ey, i: obj.ID};
        }).sort((a, b) => a.v - b.v);

        this.mapObjects    = arrayToObject(this.easyFlipObjectsToFlip, 'ID');
        this.mapObjects[0] = containerObject;
    }

    public easyFlipResizeEnd($event) {
        const incomingRect = {
            top:  $event.position.top,
            left: $event.position.left,
            w:    $event.size.width,
            h:    $event.size.height
        };

        if (!this.isEnabled) {
            this.easyFlipEnd.emit(incomingRect);
            return;
        }
        this.easyFlipEnd.emit(this.easyFlipResize($event));
    }

    public easyFlipResize($event) {

        const incomingRect = {
            top:  $event.position.top,
            left: $event.position.left,
            w:    $event.size.width,
            h:    $event.size.height
        };

        if (!this.isEnabled) {
            return;
        }

        this.easyFlipVLineStyle['opacity'] = '0.0';
        this.easyFlipVLineStyle['left']    = '0px';
        this.easyFlipVLineStyle['top']     = '0px';
        this.easyFlipVLineStyle['width']   = '0px';

        this.easyFlipHLineStyle['opacity'] = '0.0';
        this.easyFlipHLineStyle['top']     = '0px';
        this.easyFlipHLineStyle['height']  = '0px';
        this.easyFlipHLineStyle['left']    = '0px';


        let width  = incomingRect.w;
        let height = incomingRect.h;
        let left   = incomingRect.left;
        let top    = incomingRect.top;

        const halfW    = incomingRect.w / 2;
        const halfH    = incomingRect.h / 2;
        const centerX  = incomingRect.left + halfW;
        const centerY  = incomingRect.top  + halfH;
        const right    = incomingRect.left + width;
        const bottom   = incomingRect.top + height;
        const reverseX = incomingRect.left === this.startedRect.left;
        const reverseY = incomingRect.top  === this.startedRect.top;


        const resultLeft = this.findFlipResult(
            left,
            centerX,
            right,
            halfW,
            this.objectsPositionsX,
            this.objectsPositionsCX,
            this.objectsPositionsEX,
            reverseX
        );

        const resultTop = this.findFlipResult(
            top,
            centerY,
            bottom,
            halfH,
            this.objectsPositionsY,
            this.objectsPositionsCY,
            this.objectsPositionsEY,
            reverseY
        );

        const eventFlip = {
            leftObj: this.mapObjects[resultLeft.objectID],
            topObj:  this.mapObjects[resultTop.objectID],
            x:  resultLeft.v,
            y:  resultTop.v,
            w:  incomingRect.w,
            h:  incomingRect.h,
            cx: resultLeft.v + (incomingRect.w / 2),
            cy: resultTop.v  + (incomingRect.h / 2),
            ex: resultLeft.v + incomingRect.w,
            ey: resultTop.v  + incomingRect.h,
            leftFlip: resultLeft,
            topFlip: resultTop,
        };

        if (resultLeft.isFlip || resultTop.isFlip) {

            if (resultTop.isFlip) {
                if (resultTop.reverse)  {
                    height = resultTop.v;
                    this.element.nativeElement.style.height = height + 'px';
                } else {
                    height = top + height - resultTop.v;
                    this.element.nativeElement.style.height = height + 'px';
                    top = resultTop.v;
                    this.element.nativeElement.style.top    = top + 'px';
                }

                const flip = resultTop;
                const objToFlip = eventFlip.topObj;
                if (flip.dir === 1) {
                    this.easyFlipVLineStyle['top'] = objToFlip.y + 'px';
                }
                if (flip.dir === 2) {
                    this.easyFlipVLineStyle['top'] = objToFlip.cy + 'px';
                }
                if (flip.dir === 3) {
                    this.easyFlipVLineStyle['top'] = objToFlip.ey + 'px';
                }
                const toX   = objToFlip.ex > right ? objToFlip.ex : right;
                const fromX = objToFlip.x < left   ? objToFlip.x  : left;
                const wV = toX - fromX;

                this.easyFlipVLineStyle['opacity'] = '1.0';
                this.easyFlipVLineStyle['left'] = fromX + 'px';
                this.easyFlipVLineStyle['width'] = wV + 'px';
            }

            if (resultLeft.isFlip) {
                if (resultLeft.reverse)  {
                    width = resultLeft.v;
                    this.element.nativeElement.style.height = height + 'px';
                    this.element.nativeElement.style.width = width + 'px';
                } else {
                    width = left + width - resultLeft.v;
                    this.element.nativeElement.style.width = width + 'px';
                    left = resultLeft.v;
                    this.element.nativeElement.style.left = left + 'px';
                }

                const flip = resultLeft;
                const objToFlip = eventFlip.leftObj;
                if (flip.dir === 1) {
                    this.easyFlipHLineStyle['left'] = objToFlip.x + 'px';
                }
                if (flip.dir === 2) {
                    this.easyFlipHLineStyle['left'] = objToFlip.cx + 'px';
                }
                if (flip.dir === 3) {
                    this.easyFlipHLineStyle['left'] = objToFlip.ex + 'px';
                }
                const toY   = objToFlip.ey > bottom ? objToFlip.ey : bottom;
                const fromY = objToFlip.y < top   ? objToFlip.y  : top;
                const hH = toY - fromY;

                this.easyFlipHLineStyle['opacity'] = '1.0';
                this.easyFlipHLineStyle['top'] = fromY + 'px';
                this.easyFlipHLineStyle['height'] = hH + 'px';
            }
        }


        return {
            top:  top,
            left: left,
            w:    width,
            h:    height
        };
    }


    @Input('appEasyFlipResize')
    set allowFlip(value: boolean) {
        this.isEnabled = value;
    }

}
