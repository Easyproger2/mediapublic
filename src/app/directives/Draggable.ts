import {Directive, Input, ElementRef, HostListener, OnInit, EventEmitter, Output} from '@angular/core';
import {fromEvent, Subscription} from 'rxjs';


const arrayToObject = (array, keyField) =>
    array.reduce((obj, item) => {
        obj[item[keyField]] = item;
        return obj;
    }, {});


@Directive({
    selector: '[appEasyDrag]'
})
export class EasyDragDirective implements OnInit {
    private topStart: number;
    private leftStart: number;
    private _allowDrag = true;
    private md: boolean;
    private _handle: HTMLElement;

    private moved = false;


    private objectsPositionsX  = [];
    private objectsPositionsY  = [];
    private objectsPositionsCX = [];
    private objectsPositionsCY = [];
    private objectsPositionsEX = [];
    private objectsPositionsEY = [];

    @Input() easyDragObjectsSelected = [];



    @Input() easyDragWidthEditZone  = 0;
    @Input() easyDragHeightEditZone = 0;
    @Input() easyDragFlipEnabled    = true;
    @Input() easyDragLockAxis       = '';
    @Input() easyDragSelfObject     = null;
    @Input() easyDragRectObject     = {};
    @Input() easyDragForceFlip      = 25;
    @Input() easyDragObjectsForFlip = [];
    @Input() easyDragDeltaToDrag    = 115;

    @Input() easyDragVLineStyle  = {};
    @Input() easyDragHLineStyle  = {};

    @Output() easyDragPressDown  = new EventEmitter<any>();
    @Output() easyDragPressUp    = new EventEmitter<any>();
    @Output() easyDragFlipEvent  = new EventEmitter<any>();
    @Output() easyDragStopMoved  = new EventEmitter<any>();
    @Output() easyDragStartMoved = new EventEmitter<any>();


    private eventX = 0;
    private eventY = 0;

    private mapObjects = {};

    private draggingSub: Subscription = null;

    constructor(public element: ElementRef) {
    }


    ngOnInit() {
        // css changes
        if (this._allowDrag) {
            this.element.nativeElement.style.position = 'absolute';
            this.element.nativeElement.className += ' cursor-draggable';
        }
    }


    private subscribeEvents() {
        this.draggingSub =   fromEvent(document, 'mousemove',
            { passive: false }).subscribe(event => this.onMouseMove(event as MouseEvent));
        this.draggingSub.add(fromEvent(document, 'mouseup',
            { passive: false }).subscribe(() => this.onMouseLeave()));
        this.draggingSub.add(fromEvent(document, 'mouseleave',
            { passive: false }).subscribe(() => this.onMouseLeave()));
    }

    private unsubscribeEvents() {
        if (this.draggingSub === null) {
            return;
        }
        this.draggingSub.unsubscribe();
        this.draggingSub = null;
    }





    @HostListener('mousedown', ['$event'])
    onMousedown(event: MouseEvent) {
        if (event.button === 2 || (this._handle !== undefined && event.target !== this._handle)) {
            return; // prevents right click drag, remove his if you don't want it
        }
        this.easyDragPressDown.emit();



        if (this.easyDragFlipEnabled) {
            const objectsFilteredSelf = this.easyDragObjectsForFlip.filter((element) => {
                return element.ID !== this.easyDragSelfObject.ID && element.selected === false;
            });

            const rectObject = {
                ID: 0,
                x:  0,
                y:  0,
                w:  this.easyDragWidthEditZone,
                h:  this.easyDragHeightEditZone,
                cx: this.easyDragWidthEditZone / 2,
                cy: this.easyDragHeightEditZone / 2,
                ex: this.easyDragWidthEditZone,
                ey: this.easyDragHeightEditZone
            };

            objectsFilteredSelf.push(rectObject);

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


            this.mapObjects = arrayToObject(this.easyDragObjectsForFlip, 'ID');
            this.mapObjects[0] = rectObject;
        }


        this.md = true;
        this.eventX = event.clientX;
        this.eventY = event.clientY;
        this.topStart = event.clientY - this.element.nativeElement.style.top.replace('px', '');
        this.leftStart = event.clientX - this.element.nativeElement.style.left.replace('px', '');




        if (this.easyDragSelfObject.selected && !this.easyDragSelfObject.locked) {
            for (const attachedObjectKey in this.easyDragObjectsSelected) {
                if (!this.easyDragObjectsSelected.hasOwnProperty(attachedObjectKey)) {
                    continue;
                }

                const attachedObject = this.easyDragObjectsSelected[attachedObjectKey];
                if (attachedObject.o.locked) {
                    continue;
                }
                const attachedNativeElement = attachedObject.e;

                attachedObject.topStart  = event.clientY - parseFloat(attachedNativeElement.style.top.replace('px', ''));
                attachedObject.leftStart = event.clientX - parseFloat(attachedNativeElement.style.left.replace('px', ''));
            }
        }




        this.moved = false;


        this.subscribeEvents();
    }

    onMouseLeave() {
        this.md = false;
        this.easyDragPressUp.emit();
        if (this.moved) {
            this.easyDragStopMoved.emit({
                top: this.element.nativeElement.style.top.replace('px', ''),
                left: this.element.nativeElement.style.left.replace('px', ''),
                objectDragged: this.easyDragSelfObject
            });

            if (this.easyDragSelfObject.selected && !this.easyDragSelfObject.locked) {
                for (const attachedObjectKey in this.easyDragObjectsSelected) {
                    if (!this.easyDragObjectsSelected.hasOwnProperty(attachedObjectKey)) {
                        continue;
                    }
                    const attachedObject = this.easyDragObjectsSelected[attachedObjectKey];
                    if (attachedObject.o.ID === this.easyDragSelfObject.ID || attachedObject.o.locked) {
                        continue;
                    }
                    const attachedNativeElement = attachedObject.e;

                    this.easyDragStopMoved.emit({
                        top: attachedNativeElement.style.top.replace('px', ''),
                        left: attachedNativeElement.style.left.replace('px', ''),
                        objectDragged: attachedObject.o
                    });
                }
            }
        }

        this.unsubscribeEvents();
        this.moved = false;
    }

    findClosestIn(searchVar, searchArray) {
        return searchArray.reduce(function(prev, curr) {
            return (Math.abs(curr.v - searchVar) < Math.abs(prev.v - searchVar) ? curr : prev);
        });
    }

    findClosesByEdge(edge, itemsPos, itemsPosCenters, itemsPosEnd) {
        const p = this.findClosestIn(edge, itemsPos);
        const c = this.findClosestIn(edge, itemsPosCenters);
        const e = this.findClosestIn(edge, itemsPosEnd);

        p.dir = 1; // start
        c.dir = 2; // center
        e.dir = 3; // end

        const a = [p, c, e];
        return this.findClosestIn(edge, a);
    }

    findFlipResult(pos, center, elementEnd, half, itemsPos, itemsPosCenters, itemsPosEnd) {
        const resultFlip = {
            dir: 0,
            objectID: 0,
            isFlip: false,
            v: 0
        };
        let flip = false;

        const closestR = this.findClosesByEdge(pos, itemsPos, itemsPosCenters, itemsPosEnd);
        let findClosest = 0;

        const closestA = [];
        const closestElements = {};


        if (Math.abs(pos - closestR.v ) < this.easyDragForceFlip) {
            findClosest = closestR.v;
            closestA.push({v: findClosest, i: 0});
            closestElements[0] = closestR;
            flip = true;
        }
        let findClosestC = 0;
        const closestRC = this.findClosesByEdge(center, itemsPos, itemsPosCenters, itemsPosEnd);
        if (Math.abs(center - closestRC.v) < this.easyDragForceFlip) {
            findClosestC = closestRC.v - half;
            closestA.push({v: findClosestC, i: 1});
            closestElements[1] = closestRC;
            flip = true;
        }

        let findClosestE = 0;
        const closestRE = this.findClosesByEdge(elementEnd, itemsPos, itemsPosCenters, itemsPosEnd);
        if (Math.abs(elementEnd - closestRE.v) < this.easyDragForceFlip) {
            findClosestE = closestRE.v - (half * 2);
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

    onMouseMove(event: MouseEvent) {
        if (this.md && this._allowDrag) {
            const elementPositionTop  = parseInt(this.element.nativeElement.style.top, 10);
            const elementPositionLeft = parseInt(this.element.nativeElement.style.left, 10);

            const elementSizeW = parseInt(this.element.nativeElement.style.width, 10);
            const elementSizeH = parseInt(this.element.nativeElement.style.height, 10);

            const halfWidth = elementSizeW / 2;
            const halfHeight = elementSizeH / 2;


            let newElementPositionTop = (event.clientY - this.topStart);
            let newElementPositionLeft = (event.clientX - this.leftStart);

            const oldElementPositionTop  = newElementPositionTop;
            const oldElementPositionLeft = newElementPositionLeft;

            const elementCenterX = newElementPositionLeft + (elementSizeW / 2);
            const elementCenterY = newElementPositionTop + (elementSizeH / 2);

            const elementEndX = newElementPositionLeft + elementSizeW;
            const elementEndY = newElementPositionTop + elementSizeH;

            const deltaTop = Math.abs(elementPositionTop - newElementPositionTop);
            const deltaLeft = Math.abs(elementPositionLeft - newElementPositionLeft);

            const deltaMove = deltaTop > deltaLeft ? deltaTop : deltaLeft;

            this.easyDragVLineStyle['opacity'] = '0.0';
            this.easyDragVLineStyle['left']    = '0px';
            this.easyDragVLineStyle['top']     = '0px';
            this.easyDragVLineStyle['width']   = '0px';

            this.easyDragHLineStyle['opacity'] = '0.0';
            this.easyDragHLineStyle['top']     = '0px';
            this.easyDragHLineStyle['height']  = '0px';
            this.easyDragHLineStyle['left']    = '0px';

            if (deltaMove > this.easyDragDeltaToDrag || this.moved) {
                if (!this.moved) {
                    this.easyDragStartMoved.emit();
                }

                this.moved = true;

                if (this.easyDragFlipEnabled) {
                    const resultLeft = this.findFlipResult(
                        newElementPositionLeft,
                        elementCenterX,
                        elementEndX,
                        halfWidth,
                        this.objectsPositionsX,
                        this.objectsPositionsCX,
                        this.objectsPositionsEX
                    );

                    const resultTop = this.findFlipResult(
                        newElementPositionTop,
                        elementCenterY,
                        elementEndY,
                        halfHeight,
                        this.objectsPositionsY,
                        this.objectsPositionsCY,
                        this.objectsPositionsEY
                    );


                    if (this.easyDragLockAxis === 'x') {
                        resultTop.isFlip = false;
                        resultTop.v = elementPositionTop;
                    } else if (this.easyDragLockAxis === 'y') {
                        resultLeft.v = elementPositionLeft;
                        resultLeft.isFlip = false;
                    }

                    if (resultLeft.isFlip || resultTop.isFlip) {
                        const eventFlip = {

                            selfCenterX: newElementPositionLeft + (elementSizeW / 2),
                            selfCenterY: newElementPositionTop + (elementSizeH / 2),

                            leftObj: this.mapObjects[resultLeft.objectID],
                            topObj: this.mapObjects[resultTop.objectID],
                            x:  resultLeft.v,
                            y:  resultTop.v,
                            w:  elementSizeW,
                            h:  elementSizeH,
                            cx: resultLeft.v + halfWidth,
                            cy: resultTop.v  + halfHeight,
                            ex: resultLeft.v + elementSizeW,
                            ey: resultTop.v  + elementSizeH,
                            selfObject: this.easyDragSelfObject,
                            leftFlip: resultLeft,
                            topFlip: resultTop
                        };

                        this.easyDragFlipEvent.emit(eventFlip);

                        if (resultTop.isFlip) {
                            const flip = resultTop;
                            const objToFlip = eventFlip.topObj;
                            if (flip.dir === 1) {
                                this.easyDragVLineStyle['top'] = objToFlip.y + 'px';
                            }
                            if (flip.dir === 2) {
                                this.easyDragVLineStyle['top'] = objToFlip.cy + 'px';
                            }
                            if (flip.dir === 3) {
                                this.easyDragVLineStyle['top'] = objToFlip.ey + 'px';
                            }
                            const toX   = objToFlip.ex > eventFlip.ex ? objToFlip.ex : eventFlip.ex;
                            const fromX = objToFlip.x < eventFlip.x   ? objToFlip.x  : eventFlip.x;
                            const w = toX - fromX;

                            this.easyDragVLineStyle['opacity'] = '1.0';
                            this.easyDragVLineStyle['left'] = fromX + 'px';
                            this.easyDragVLineStyle['width'] = w + 'px';
                        }

                        if (resultLeft.isFlip) {
                            const flip = resultLeft;
                            const objToFlip = eventFlip.leftObj;
                            if (flip.dir === 1) {
                                this.easyDragHLineStyle['left'] = objToFlip.x + 'px';
                            }
                            if (flip.dir === 2) {
                                this.easyDragHLineStyle['left'] = objToFlip.cx + 'px';
                            }
                            if (flip.dir === 3) {
                                this.easyDragHLineStyle['left'] = objToFlip.ex + 'px';
                            }
                            const toY   = objToFlip.ey > eventFlip.ey ? objToFlip.ey : eventFlip.ey;
                            const fromY = objToFlip.y < eventFlip.y   ? objToFlip.y  : eventFlip.y;
                            const h = toY - fromY;

                            this.easyDragHLineStyle['opacity'] = '1.0';
                            this.easyDragHLineStyle['top'] = fromY + 'px';
                            this.easyDragHLineStyle['height'] = h + 'px';
                        }
                    } else {

                    }

                    newElementPositionLeft = resultLeft.v;
                    newElementPositionTop  = resultTop.v;
                }


                if (this.easyDragLockAxis === 'x') {
                    this.element.nativeElement.style.left = newElementPositionLeft + 'px';
                } else if (this.easyDragLockAxis === 'y') {
                    this.element.nativeElement.style.top = newElementPositionTop + 'px';
                } else {
                    this.element.nativeElement.style.top = newElementPositionTop + 'px';
                    this.element.nativeElement.style.left = newElementPositionLeft + 'px';
                }


                if (this.easyDragSelfObject.selected && !this.easyDragSelfObject.locked) {
                    const deltaFlipTop  = newElementPositionTop  - oldElementPositionTop;
                    const deltaFlipLeft = newElementPositionLeft - oldElementPositionLeft;

                    for (const attachedObjectKey in this.easyDragObjectsSelected) {
                        if (!this.easyDragObjectsSelected.hasOwnProperty(attachedObjectKey)) {
                            continue;
                        }
                        const attachedObject = this.easyDragObjectsSelected[attachedObjectKey];
                        if (attachedObject.o.ID === this.easyDragSelfObject.ID || attachedObject.o.locked) {
                            continue;
                        }
                        const attachedNativeElement = attachedObject.e;

                        const newAttachedElementPositionTop  = (event.clientY - attachedObject.topStart);
                        const newAttachedElementPositionLeft = (event.clientX - attachedObject.leftStart);

                        const attachedPositionTop  = newAttachedElementPositionTop + deltaFlipTop;
                        const attachedPositionLeft = newAttachedElementPositionLeft + deltaFlipLeft;

                        attachedNativeElement.style.top  = attachedPositionTop + 'px';
                        attachedNativeElement.style.left = attachedPositionLeft + 'px';
                    }
                }
            }
        }
    }



    @Input('appEasyDrag')
    set allowDrag(value: boolean) {
        this._allowDrag = value;
        if (this._allowDrag) {
            this.element.nativeElement.className += ' cursor-draggable';
        } else {
            this.element.nativeElement.className = this.element.nativeElement.className
                .replace(' cursor-draggable', '');
        }
    }



    @Input()
    set ng2DraggableHandle(handle: HTMLElement) {
        this._handle = handle;
    }
}
