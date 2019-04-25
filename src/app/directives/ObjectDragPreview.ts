import {Directive, ElementRef, Input, OnInit} from '@angular/core';

@Directive({
    selector: '[appObjectDragPreviewElement]',
    exportAs: 'objectDragPreview'
})
export class ObjectDragPreviewDirective implements OnInit {


    public objectDragInfo = null;
    constructor(public element: ElementRef) {
    }

    ngOnInit() {

    }

    @Input('appObjectDragPreviewElement')
    set setObjectDragInfo(properties: boolean) {
        this.objectDragInfo = properties;
    }
}
