import {Directive, Input, ElementRef, HostListener, OnInit, EventEmitter, Output, SimpleChanges, OnChanges} from '@angular/core';

@Directive({
    selector: '[appCollectionDragFrame]'
})
export class CollectionDragFrameDirective implements OnInit, OnChanges {

    topStart: number;
    leftStart: number;

    @Input() dropZone = null;
    @Input() frameCollectionCanMove = false;
    @Input() startMove = null;
    @Output() frameStopMove = new EventEmitter<any>();
    @Output() hitDropZone = new EventEmitter<any>();
    @Output() dropCollection = new EventEmitter<any>();

    constructor(public element: ElementRef) {
        this.topStart = 0;
        this.leftStart = 0;
    }


    ngOnInit() {
    }

    ngOnChanges(changes: SimpleChanges) {
        if (changes.frameCollectionCanMove) {
            const newElementPositionTop = (this.startMove.clientY - this.topStart);
            const newElementPositionLeft = (this.startMove.clientX - this.leftStart);
            this.element.nativeElement.style.top = newElementPositionTop + 'px';
            this.element.nativeElement.style.left = newElementPositionLeft + 'px';
            this.element.nativeElement.style.visibility = !this.frameCollectionCanMove ? 'hidden' : 'visible';
        }
    }
    @HostListener('mousedown', ['$event'])
    onMouseDown(event: MouseEvent) {
        if (event.button === 2) {
            return;
        }
        this.frameCollectionCanMove = true;
    }

    @HostListener('document:mouseup', [ '$event' ])
    onMouseUp(event: MouseEvent) {
        if (!this.frameCollectionCanMove) {
            return;
        }
        this.frameCollectionCanMove = false;
        this.frameStopMove.emit();

        if (this.isInBox()) {
            this.dropCollection.emit();
        }
    }

    isInBox() {
        const rect = this.dropZone.getBoundingClientRect();

        const x      = rect.x;
        const y      = rect.y;
        const width  = rect.width;
        const height = rect.height;

        const xPoint = parseInt(this.element.nativeElement.style.left , 10);
        const yPoint = parseInt(this.element.nativeElement.style.top, 10);

        return x <= xPoint && xPoint <= x + width &&
            y <= yPoint && yPoint <= y + height;
    }


    @HostListener('document:mousemove', ['$event'])
    onMouseMove(event: MouseEvent) {
        if (this.frameCollectionCanMove) {
            const newElementPositionTop = (event.clientY - this.topStart);
            const newElementPositionLeft = (event.clientX - this.leftStart);
            this.element.nativeElement.style.top = newElementPositionTop + 'px';
            this.element.nativeElement.style.left = newElementPositionLeft + 'px';

            this.hitDropZone.emit(this.isInBox());
        }
    }

    @HostListener('document:mouseleave', ['$event'])
    onMouseLeave(event: MouseEvent) {
        this.frameCollectionCanMove = false;
    }

    @Input('appCollectionDrag')
    set allowDrag(value: boolean) {
    }



}
