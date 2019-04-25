import {Directive, ElementRef, EventEmitter, HostListener, Input, OnInit, Output, Renderer2} from '@angular/core';
import {fromEvent, Subscription} from 'rxjs';


@Directive({
    selector: '[appDragCollection]'
})
export class DragCollectionDirective implements OnInit {
    private topStart: number;
    private leftStart: number;
    private md: boolean;

    deltaMove = 5;

    @Input() headerCollectionRef = null;


    @Output() startDeltaDrag = new EventEmitter<any>();

    private draggingSub: Subscription = null;

    constructor(public element: ElementRef, private renderer: Renderer2) {
    }

    ngOnInit() {

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
    onMouseDown(event: MouseEvent) {
        if (event.button === 2) {
        }

        event.stopPropagation();
        event.preventDefault();


        if (this.headerCollectionRef !== null) {
            this.renderer.addClass(this.headerCollectionRef, 'collection-row-active');
        }

        this.md = true;
        this.topStart = event.clientY - this.element.nativeElement.style.top.replace('px', '');
        this.leftStart = event.clientX - this.element.nativeElement.style.left.replace('px', '');


        this.subscribeEvents();
    }
    onMouseLeave() {
        this.md = false;

        if (this.headerCollectionRef !== null) {
            this.renderer.removeClass(this.headerCollectionRef, 'collection-row-active');
        }
        this.unsubscribeEvents();
    }

    onMouseMove(event: MouseEvent) {
        if (this.md) {
            const elementPositionTop  = this.element.nativeElement.style.top.replace('px', '');
            const elementPositionLeft = this.element.nativeElement.style.left.replace('px', '');

            const newElementPositionTop = (event.clientY - this.topStart);
            const newElementPositionLeft = (event.clientX - this.leftStart);

            const deltaTop = Math.abs(elementPositionTop - newElementPositionTop);
            const deltaLeft = Math.abs(elementPositionLeft - newElementPositionLeft);

            const deltaMove = deltaTop > deltaLeft ? deltaTop : deltaLeft;

            if (deltaMove > this.deltaMove) {
                this.md = false;
                this.startDeltaDrag.emit(event);
            }
        }
    }
}
