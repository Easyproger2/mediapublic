import {Component, NgZone, OnInit, HostListener, ViewChild, ElementRef, ViewChildren, QueryList} from '@angular/core';
import {FormControl} from '@angular/forms';
import {ApiService} from '../services/api.service';
import {AlertService} from 'ngx-alerts';
import {CdkDragDrop, moveItemInArray} from '@angular/cdk/drag-drop';

import * as Fuse from 'fuse.js';

import {SelectContainerComponent} from 'ngx-drag-to-select';
import {FuseOptions} from 'fuse.js';
import {ObjectDragPreviewDirective} from '../directives/ObjectDragPreview';


const arrayToObject = (array, keyField) =>
    array.reduce((obj, item) => {
        obj[item[keyField]] = item;
        return obj;
    }, {});




@Component({
    selector: 'app-template-editor',
    templateUrl: './template-editor.component.html',
    styleUrls: ['./template-editor.component.scss']
})
export class TemplateEditorComponent implements OnInit {

    @ViewChild(SelectContainerComponent) selectContainer: SelectContainerComponent;


    objectsSelected = [];
    filteredTemplatesCollections = [];
    filteredLibraryCollection = [];
    collectionDragElementHitEditZone = false;
    libraryObjectsStyles = {};
    enabledSelectObject = true;

    selectedTabRightPanel = 0;
    shiftKey = false;
    altKey = false;

    flipObjectsResizeForce = 25;
    flipObjectsResizeEnabled = true;

    flipObjectsForce = 25;
    flipObjectsEnabled = true;


    globalLockAxis = '';

    collectionDrag = null;

    horizontalEditLineStyles = {};
    verticalEditLineStyles   = {};

    public loading = false;

    public widthEdit = 1920;
    public heightEdit = 1080;

    public deltaToDrag = 15;

    public widthEditZone = 1024;
    public heightEditZOne = 576;


    public widthEditTMP = 1920;
    public heightEditTMP = 1080;

    public widthEditZoneTMP = 1024;
    public heightEditZOneTMP = 576;

    public widthNewObject = 200;



    objectExample = null;
    multiSelect = false;
    libraryOpened = false;

    inputFindLibraryObject = new FormControl();
    inputFindTemplate = new FormControl();

    selectedRecord = 0;
    templateRecordsList: any[] = [];
    templateList: any[] = [];
    modifiersList: any[] = [];
    attributesList: any[] = [];
    collectionDataList: any[] = [];
    collectionDataListArray: any[] = [];

    recordInfo = null;
    objectInfo = null;
    templateInfo;



    @ViewChildren('objectDragPreviewElement') objectDragPreviewElements !: QueryList<ObjectDragPreviewDirective>;
    @ViewChild('editZone') editZoneElementRef: ElementRef;
    @ViewChild('libraryOpenButton') libraryOpenButtonElementRef: ElementRef;
    @ViewChild('libraryObjects') libraryObjectsElementRef: ElementRef;

    frameCollectionCanMove = false;

    static roundToTwo(num) {
        // @ts-ignore
        return +(Math.round(num + 'e+2')  + 'e-2');
    }

    static display(template): string {
        return template && template.name ? template.name : template;
    }

    static getTMPModifier() {
        return {
            ID: 0,
            minTMP: '',
            maxTMP: '',
            minAttrTMP: '',
            maxAttrTMP: ''
        };
    }
    static prepareModifierToEdit(modifier) {
        modifier.minTMP     = modifier.min;
        modifier.maxTMP     = modifier.max;
        modifier.minAttrTMP = modifier.minAttr;
        modifier.maxAttrTMP = modifier.maxAttr;
    }
    static acceptTMPToModifier(modifier) {
        modifier.min     = modifier.minTMP;
        modifier.max     = modifier.maxTMP;
        modifier.minAttr = modifier.minAttrTMP;
        modifier.maxAttr = modifier.maxAttrTMP;
    }


    static getCollectionFieldPropertiesForObject(object, collectionDataList) {

        if (object.sourceType === 0) {
            // collection
            const collectionID = object.sourceID;

            if (!collectionDataList.hasOwnProperty(collectionID)) {
                return null;
            }

            const collection       = collectionDataList[collectionID];
            const sourceParam      = object.sourceParam;
            const collectionFields = collection.fields;

            if (!collectionFields.hasOwnProperty(sourceParam)) {
                return null;
            }

            return collectionFields[sourceParam];
        }

        return null;
    }

    static formatObject(obj, collectionDataList) {


        const collectionFieldProperties = TemplateEditorComponent.getCollectionFieldPropertiesForObject(obj, collectionDataList);
        obj.layerName = 'Unknown for: ' + obj.sourceID + ':' + obj.sourceParam;

        if (collectionFieldProperties !== null) {
            obj.layerName = collectionFieldProperties.name;
        }
        if (obj.objectType === null) {
            obj.objectType = '';
        }
        obj.selected = false;
        obj.keyRecord = obj.sourceID + ':' + obj.sourceParam;

        obj.lockAxisGlobal = true;
        obj.lockAxis = '';
        obj.locked = false;

        obj.deltaToDragGlobal = true;
        obj.deltaToDrag = 15;


        obj.flipObjectsResizeEnabledGlobal = true;
        obj.flipObjectsResizeForce = 25;
        obj.flipObjectsResizeEnabled = false;

        obj.flipObjectsEnabledGlobal = true;
        obj.flipObjectsForce = 25;
        obj.flipObjectsEnabled = false;

        const styles = obj.styles[obj.styleID];
        const stylesFormatted = {};
        for (const styleKey in styles) {
            if (!styles.hasOwnProperty(styleKey)) {
                continue;
            }

            const style = styles[styleKey];

            const value = style.value;
            const name  = style.name;

            stylesFormatted[name] = value;
        }

        obj.formattedStyles = stylesFormatted;
    }

    static formatData(templateInfo, collectionDataList) {
        const objs = templateInfo.objects;
        for (const objKey in objs) {
            if (!objs.hasOwnProperty(objKey)) {
                continue;
            }
            const obj = objs[objKey];
            TemplateEditorComponent.formatObject(obj, collectionDataList);
        }
    }

    static formatConnectedModifiers(obj) {
        const styles = obj.styles[obj.styleID];

        let modifierFormatted = null;

        for (const styleKey in styles) {
            if (!styles.hasOwnProperty(styleKey)) {
                continue;
            }
            const style = styles[styleKey];
            const styleName  = style.name;
            const modifiers = style.modifiers;

            for (const modifiersKey in modifiers) {
                if (!modifiers.hasOwnProperty(modifiersKey)) {
                    continue;
                }
                const modifierStyle = modifiers[modifiersKey];

                if (!modifierFormatted) {
                    modifierFormatted = {};
                }
                if (!modifierFormatted[modifierStyle.ID]) {
                    modifierFormatted[modifierStyle.ID] = {};
                }
                modifierFormatted[modifierStyle.ID][styleName] = modifierStyle;
            }
        }

        obj.formattedModifiers = modifierFormatted;
    }

    static prepareStyleToEdit(style) {
        style.scaled_flagTMP = style.scaled_flag;
        style.valueTMP = style.value;
    }

    static acceptStyleEdit(style) {
        style.scaled_flag = style.scaled_flagTMP;
        style.value = style.valueTMP;
    }





    constructor(private _ngZone: NgZone,
                private apiService: ApiService,
                private alertsService: AlertService) {
        this.clearInputFindTemplate();
    }





    getStyleReadyDropFrameCollection(lengthElements, widthElement) {
        widthElement += 30; // margin elements
        const maxElementW = Math.ceil(this.widthEditZone / widthElement) - 1;
        let width = 0;
        if (lengthElements > maxElementW) {
            width = maxElementW * widthElement;
        } else {
            width = lengthElements * widthElement;
        }

        const style = {};
        style['width'] = width + 'px';
        return style;
    }

    collectionElementMove(hitEditZone) {
        if (this.collectionDrag) {
            this.collectionDrag.readyDrop = hitEditZone;
        }
        this.collectionDragElementHitEditZone = hitEditZone;
    }

    dropCollection() {
        this.collectionDragElementHitEditZone = false;
        this.clearSelection();


        this.templateInfo.id = -(new Date()).getTime();
        this.templateInfo.name = 'Новый';

        const dragElementsRef = this.objectDragPreviewElements.toArray();
        for (const objKey in dragElementsRef) {
            if (!dragElementsRef.hasOwnProperty(objKey)) {
                continue;
            }

            const objDirective      = dragElementsRef[objKey];
            const objectParams      = objDirective.objectDragInfo;
            const dragNativeElement = objDirective.element.nativeElement;
            const rectObject        = dragNativeElement.getBoundingClientRect();
            const editRect          = this.editZoneElementRef.nativeElement.getBoundingClientRect();

            const xObject = rectObject.left - editRect.left;
            const yObject = rectObject.top  - editRect.top;

            const newObject = JSON.parse(JSON.stringify(this.objectExample));
            newObject.ID          = -(new Date()).getTime() + objKey;
            newObject.sourceID    = objectParams.sourceID;
            newObject.sourceType  = objectParams.sourceType;
            newObject.sourceParam = objectParams.sourceParam;
            newObject.objectType  = objectParams.type;

            const styles    = newObject.styles[newObject.styleID];
            const styleLeft = styles['left'];
            const styleTop  = styles['top'];

            styleLeft.value = xObject + 'px';
            styleTop.value  = yObject + 'px';

            this.templateInfo.objects.push(newObject);

            TemplateEditorComponent.formatObject(newObject, this.collectionDataList);
            this.preProcessStyle(newObject, this.widthEditZone, this.heightEditZOne);
        }


        this.apiService.sendMessages(this.getTemplateRecords(this.templateInfo));
    }

    stopDragCollection() {
        this.frameCollectionCanMove = false;
    }
    startDragCollection(whatDrag) {
        this.closeLibrary(null);
        this.frameCollectionCanMove = true;
        this.collectionDrag = whatDrag;
    }



    closeLibrary(event) {
        const r = this.libraryObjectsElementRef.nativeElement.getBoundingClientRect();

        this.libraryObjectsStyles['left'] = r.x + 'px';
        this.libraryObjectsStyles['top'] = r.y + 'px';


        if (!this.libraryOpened) {
            return;
        }

        if (event !== null) {
            event.stopPropagation();
            event.preventDefault();
        }

        this.libraryOpened = false;
    }
    openLibrary(event) {
        if (this.libraryOpened) {
            this.closeLibrary(event);
            return;
        }

        if (event !== null) {
            event.stopPropagation();
            event.preventDefault();
        }

        if (!this.libraryObjectsStyles.hasOwnProperty('left')) {
            const r = this.libraryOpenButtonElementRef.nativeElement.getBoundingClientRect();
            const x = r.x + r.width;
            const y = r.y + r.height;
            this.libraryObjectsStyles['left'] = x + 'px';
            this.libraryObjectsStyles['top'] =  y + 'px';
        }


        this.libraryOpened = true;
    }


    applyFormattedStyles(obj) {
        const stylesFormatted = {};

        for (const modifiersKey in obj.formattedStyles) {
            if (!obj.formattedStyles.hasOwnProperty(modifiersKey)) {
                continue;
            }
            stylesFormatted[modifiersKey] = obj.formattedStyles[modifiersKey];
        }

        obj.formattedStyles = stylesFormatted;
        this.calculateDataForFlipDrag(obj);
    }

    calculateDataForFlipDrag(obj) {
        obj.x = parseFloat(obj.formattedStyles['left']);
        obj.y = parseFloat(obj.formattedStyles['top']);
        obj.w = parseFloat(obj.formattedStyles['width']);
        obj.h = parseFloat(obj.formattedStyles['height']);
        obj.cx = obj.x + (obj.w / 2);
        obj.cy = obj.y + (obj.h / 2);
        obj.ex = obj.x + obj.w;
        obj.ey = obj.y + obj.h;
        this.selectContainer.update();
    }

    ngOnInit() {
        this.apiService.sendMessages([
            this.getTemplatesListEvent(),
            this.getModifiersListEvent(),
            this.getAttributesListEvent(),
            this.getBasesList(),
            this.getObjectExample()
        ]);



        this.inputFindTemplate.valueChanges.subscribe(value => {
            value = TemplateEditorComponent.display(value);
            if (value === '') {
                this.filteredTemplatesCollections = this.templateList;
                return;
            }
            interface ItemInterface {
                name: string;
            }
            const items: ItemInterface[] = [...this.templateList];
            const options: FuseOptions<ItemInterface> = {
                keys: ['name'],
            };
            const fuse = new Fuse(items, options);
            this.filteredTemplatesCollections = fuse.search(value);
        });


        this.inputFindLibraryObject.valueChanges.subscribe(value => {
            if (value === '') {
                this.filteredLibraryCollection = this.collectionDataListArray;
                return;
            }
            interface ItemInterface {
                baseName: string;
            }
            const items: ItemInterface[] = [...this.collectionDataListArray];
            const options: FuseOptions<ItemInterface> = {
                keys: ['baseName'],
            };
            const fuse = new Fuse(items, options);
            this.filteredLibraryCollection = fuse.search(value);
        });
    }

    @HostListener('window:keydown', ['$event'])
    onKeyDown(event) {
        if (event.key === 'Backspace') {
            this.clearSelectionObjects();
        }
        this.shiftKey = event.shiftKey;
        this.altKey = event.altKey;
    }

    @HostListener('window:keyup', ['$event'])
    onKeyUp(event) {
        this.shiftKey = event.shiftKey;
        this.altKey = event.altKey;
    }

    setRecord(record) {
        this.recordInfo = record;
    }

    applyEditModifier(modifier, style, popover) {
        popover.close();
        TemplateEditorComponent.acceptTMPToModifier(modifier);
        TemplateEditorComponent.formatConnectedModifiers(this.objectInfo);
        this.applyModifiersToStyle(style, this.objectInfo, this.widthEdit, this.heightEdit);
    }
    addModifier(modifier, style, popover) {
        popover.close();
        TemplateEditorComponent.acceptTMPToModifier(modifier);
        style.modifiers[modifier.ID] = modifier;
        TemplateEditorComponent.formatConnectedModifiers(this.objectInfo);

        this.applyModifiersToStyle(style, this.objectInfo, this.widthEdit, this.heightEdit);
    }
    deleteModifier(modifier, popover, modifierStyleName) {
        popover.close();
        const styles = this.objectInfo.styles[this.objectInfo.styleID];
        const style = styles[modifierStyleName];
        delete style.modifiers[modifier.ID];
        TemplateEditorComponent.formatConnectedModifiers(this.objectInfo);

        this.applyModifiersToStyle(style, this.objectInfo, this.widthEdit, this.heightEdit);
    }
    editModifierShow(popover, modifier, modifierStyleName) {
        const styles = this.objectInfo.styles[this.objectInfo.styleID];
        const style = styles[modifierStyleName];
        TemplateEditorComponent.prepareModifierToEdit(modifier);
        const isNew = false;
        const objectInfo = this.objectInfo;
        const modifiersList = this.modifiersList;
        popover.open({popover, style, modifiersList, modifier, objectInfo, isNew, modifierStyleName});
    }
    connectModifierShow(popover, style, modifierStyleName) {
        const isNew = true;
        const objectInfo = this.objectInfo;
        const modifiersList = this.modifiersList;
        const modifier = TemplateEditorComponent.getTMPModifier();
        popover.open({popover, style, modifiersList, modifier, objectInfo, isNew, modifierStyleName});
    }

    popoverModifierAction(modifier, style, popover, isNew) {
        isNew ? this.addModifier(modifier, style, popover) : this.applyEditModifier(modifier, style, popover);
    }
    popoverModifierKeyDown(event, invalid, modifier, style, popover, isNew) {
        if (event.keyCode === 13 && !invalid) {
            this.popoverModifierAction(modifier, style, popover, isNew);
        }
    }


    popoverStyleAction(newAttribute, popover, isNew) {
        isNew ? this.addStyle(newAttribute, popover) : this.editStyle(newAttribute, popover);
    }

    popoverStyleKeyDown(event, newAttribute, popover, invalid, isNew) {
        if (event.keyCode === 13 && !invalid) {
            this.popoverStyleAction(newAttribute, popover, isNew);
        }
    }

    addStyle(newAttribute, popover) {
        popover.close();
        const styles = this.objectInfo.styles[this.objectInfo.styleID];
        styles[newAttribute.name] = newAttribute;
        const style = styles[newAttribute.name];
        const obj = this.objectInfo;
        TemplateEditorComponent.acceptStyleEdit(style);
        this.applyStyleScale(style, obj, this.widthEdit, this.heightEdit);
        this.applyModifiersToStyle(style, obj, this.widthEdit, this.heightEdit);
    }

    refreshStyleByUserEdit($event, style) {
        const obj = this.objectInfo;

        this.applyStyleScale(style, obj, this.widthEdit, this.heightEdit);
        this.applyModifiersToStyle(style, obj, this.widthEdit, this.heightEdit);
    }

    inputStyleEnterPress($event, style) {
        if ($event.keyCode === 13) {
            this.refreshStyleByUserEdit($event, style);
        }

    }




    editStyle(style, popover) {
        popover.close();
        const obj = this.objectInfo;
        TemplateEditorComponent.acceptStyleEdit(style);
        this.applyStyleScale(style, obj, this.widthEdit, this.heightEdit);
        this.applyModifiersToStyle(style, obj, this.widthEdit, this.heightEdit);
    }

    deleteStyle(attributeSelected, popover) {
        popover.close();
        const obj = this.objectInfo;
        const styles = this.objectInfo.styles[this.objectInfo.styleID];
        delete styles[attributeSelected];
        delete obj.formattedStyles[attributeSelected];

        if (this.objectInfo.stylesParent.hasOwnProperty(attributeSelected)) {
            styles[attributeSelected] = this.objectInfo.stylesParent[attributeSelected];
            this.applyStyleScale(styles[attributeSelected], obj, this.widthEdit, this.heightEdit);
            this.applyModifiersToStyle(styles[attributeSelected], obj, this.widthEdit, this.heightEdit);
        }

        TemplateEditorComponent.formatConnectedModifiers(this.objectInfo);
        this.applyFormattedStyles(obj);
    }


    editStyleShow(popover, attributeSelected) {
        const isNew = false;
        const attributesNotExist = this.objectInfo.styles[this.objectInfo.styleID];

        const isHaveParent = this.objectInfo.stylesParent.hasOwnProperty(attributeSelected);
        TemplateEditorComponent.prepareStyleToEdit(attributesNotExist[attributeSelected]);

        popover.open({popover, attributesNotExist, attributeSelected, isNew, isHaveParent});
    }

    addNewStyleShow(popover) {
        const styles = this.objectInfo.styles[this.objectInfo.styleID];
        const attributeSelected = 0;
        const attributesNotExist = {};
        const isNew = true;
        for (const attributeKey in this.attributesList) {
            if (!this.attributesList.hasOwnProperty(attributeKey)) {
                continue;
            }
            if (!styles.hasOwnProperty(attributeKey)) {
                attributesNotExist[attributeKey] = this.attributesList[attributeKey];
                attributesNotExist[attributeKey].scaled_flagTMP = false;
                attributesNotExist[attributeKey].valueTMP = attributesNotExist[attributeKey].value;
            }
        }

        popover.open({popover, attributesNotExist, attributeSelected, isNew});
    }




    refreshModifiersByUserEdit(event, invalid, modifierObj) {
        if (!invalid) {
            modifierObj.value =  modifierObj.valueTmp;
            this.applyModifiers(this.templateInfo);
        } else {
            modifierObj.valueTmp = modifierObj.value;
        }
    }

    private inputModifiersEnterPress(event, invalid, modifierObj) {
        if (event.keyCode === 13) {
            this.refreshModifiersByUserEdit(event, invalid, modifierObj);
        }
    }

    selectedTemplate(template) {



        this.apiService.sendMessages(this.getTemplateInfoEvent(template.id));
    }
    isSelectedTemplate() {
        return this.templateInfo.id !== 0;
    }

    clearInputFindTemplate() {
        this.inputFindTemplate.setValue('');
        this.clearSelectedData();
    }


    clearSelectedData() {
        this.templateInfo = {
            id: 0,
            name: 'Выберите шаблон',
            objects: []
        };

        this.objectInfo = null;
        this.selectedRecord = 0;
        this.templateRecordsList = [];
        this.recordInfo = null;
    }

    getDisplayFn() {
        return (val) => TemplateEditorComponent.display(val);
    }


    objectDeselectGroup(object) {
        object.o.selected = false;
    }

    objectSelectGroup(event) {
        for (const objectKey in event) {
            if (!event.hasOwnProperty(objectKey)) {
                continue;
            }
            const object = event[objectKey];
            if (object.o.locked) {
                continue;
            }
            object.o.selected = true;
        }
    }



    clearSelectionObjects() {
        this.templateInfo.objects = this.templateInfo.objects.filter((element) => {
            return element.selected === false;
        });
        this.clearSelection();
    }


    clearSelection() {
        this.selectContainer.clearSelection();
    }
    selectLayer(object) {
        if (this.multiSelect) {
            if (!object.selected) {
                object.selected = true;

                this.selectContainer.selectItems((item: any) => item.o.selected);
            } else {
                object.selected = false;
                this.selectContainer.deselectItems((item: any) => !item.o.selected);
            }
        } else {
            this.selectContainer.clearSelection();
            this.selectContainer.selectItems((item: any) => item.o.ID === object.ID);
            this.selectObject(object);
        }
    }

    easyDragPressDown(object) {
        this.enabledSelectObject = false;

        if (!object.selected) {
            this.clearSelection();
        }

        // if (!this.multiSelect) {
        //     this.selectContainer.deselectItems((item: any) => item.o.ID !== object.ID);
        // }

        // this.selectContainer.selectItems((item: any) => item.o.ID === object.ID);

    }
    easyDragPressUp() {
        this.enabledSelectObject = true;
    }

    selectObject(object) {
        this.objectInfo = object;
        TemplateEditorComponent.formatConnectedModifiers(this.objectInfo);
    }

    showRightPanel(panel) {
        if (!panel.opened) {
            this.selectedTabRightPanel = 0;
            panel.toggle();
        }
    }

    formatCollectionsByRecords() {

    }

    private getTemplatesListEvent() {
        this.loading = true;
        const message = this.apiService.createMessage(
            'getListTemplates', {});
        const event = this.apiService.getSubject('getListTemplates').subscribe((result) => {
            this.loading = false;
            if (result.udid !== message.udid) {
                return;
            }
            event.unsubscribe();
            if (result.result === false) {
                this.alertsService.danger('Error try later');
                return;
            }
            this.templateList = result.data.data;
            this.filteredTemplatesCollections = this.templateList;
        });
        return message;
    }


    private getAttributesListEvent() {
        this.loading = true;
        const message = this.apiService.createMessage(
            'getAttributes', {});
        const event = this.apiService.getSubject('getAttributes').subscribe((result) => {
            this.loading = false;
            if (result.udid !== message.udid) {
                return;
            }
            event.unsubscribe();
            if (result.result === false) {
                this.alertsService.danger('Error try later');
                return;
            }

            this.attributesList = result.data.data;
        });
        return message;
    }

    private getModifiersListEvent() {
        this.loading = true;
        const message = this.apiService.createMessage(
            'getModifiersList', {});
        const event = this.apiService.getSubject('getModifiersList').subscribe((result) => {
            this.loading = false;
            if (result.udid !== message.udid) {
                return;
            }
            event.unsubscribe();
            if (result.result === false) {
                this.alertsService.danger('Error try later');
                return;
            }

            this.modifiersList = result.data.data;
        });
        return message;
    }

    private getTemplateRecords(templateInfo) {
        this.loading = true;
        const message = this.apiService.createMessage(
            'getTemplateRecords', {
                objects: templateInfo.objects,
                today: 0,
                start: 0,
                end: 10
            });

        const event = this.apiService.getSubject('getTemplateRecords').subscribe((result) => {
            this.loading = false;
            if (result.udid !== message.udid) {
                return;
            }
            event.unsubscribe();
            if (result.result === false) {
                this.alertsService.danger('Error try later');
                return;
            }

            this.templateRecordsList = result.data.data;
            this.formatCollectionsByRecords();
        });
        return message;
    }



    private getTemplateInfoEvent(templateID) {
        this.loading = true;
        const message = this.apiService.createMessage(
            'getTemplateInfo', {templateID: templateID});
        const event = this.apiService.getSubject('getTemplateInfo').subscribe((result) => {
            this.loading = false;
            if (result.udid !== message.udid) {
                return;
            }
            event.unsubscribe();
            if (result.result === false) {
                this.alertsService.danger('Error try later');
                return;
            }

            this.clearSelectedData();

            this.templateInfo = result.data.data;
            this.apiService.sendMessages(this.getTemplateRecords(this.templateInfo));

            TemplateEditorComponent.formatData(this.templateInfo, this.collectionDataList);

            const widthFromScale = parseInt(this.templateInfo.smallWidth, 10);
            const heightFromScale = parseInt(this.templateInfo.smallHeight, 10);

            this.preProcessStylesTemplate(this.templateInfo, widthFromScale, heightFromScale);

        });
        return message;
    }

    private getObjectExample() {
        this.loading = true;
        const message = this.apiService.createMessage(
            'getFormatObject', {});
        const event = this.apiService.getSubject('getFormatObject').subscribe((result) => {
            this.loading = false;
            if (result.udid !== message.udid) {
                return;
            }
            event.unsubscribe();
            if (result.result === false) {
                this.alertsService.danger('Error try later');
                return;
            }

            this.objectExample = result.data.data;
        });
        return message;
    }

    private getBasesList() {
        this.loading = true;
        const message = this.apiService.createMessage(
            'getBasesInfo', {'fieldsAsObjects': 1});
        const event = this.apiService.getSubject('getBasesInfo').subscribe((result) => {
            this.loading = false;
            if (result.udid !== message.udid) {
                return;
            }
            event.unsubscribe();
            if (result.result === false) {
                this.alertsService.danger('Error try later');
                return;
            }

            this.collectionDataListArray = result.data.data;
            this.filteredLibraryCollection = this.collectionDataListArray;
            this.collectionDataList = arrayToObject(result.data.data, 'id');
        });
        return message;
    }

    private applyStyleScale(style, obj, widthToScale, heightToScale) {

        const dW = this.widthEditZone / parseInt(widthToScale, 10);
        const dH = this.heightEditZOne / parseInt(heightToScale, 10);
        const d = dW > dH ? dH : dW;

        let   value = style.value;
        const name  = style.name;

        if (style.scaled_flag) {
            value = this.regExScaleStyleValue(d, style.value);
        }

        obj.formattedStyles[name] = value;
    }


    preProcessStyle(obj, widthFromScale, heightFromScale) {
        const styles = obj.styles[obj.styleID];
        for (const styleKey in styles) {
            if (!styles.hasOwnProperty(styleKey)) {
                continue;
            }
            const style = styles[styleKey];
            this.applyStyleScale(style, obj, widthFromScale, heightFromScale);
            this.scaleStyleVarToWidthEdit(styles, styleKey, widthFromScale, heightFromScale);
        }
        this.calculateDataForFlipDrag(obj);
    }

    private preProcessStylesTemplate(templateInfo, widthFromScale, heightFromScale) {
        const objs = templateInfo.objects;
        for (const objKey in objs) {
            if (!objs.hasOwnProperty(objKey)) {
                continue;
            }
            const obj = objs[objKey];
            this.preProcessStyle(obj, widthFromScale, heightFromScale);
        }
    }


    private regExScaleStyleValue(delta, value) {
        // explain
        // direct link to test and rewrite https://regex101.com/r/xG0yA7/9
        // example aSD10px, 1.5px, 10, 0.14px , -.33pt kggy $234432, .12px, asdfasdf, 12334$
        // (^|\s|\-) start or space or -
        // \d*\.?\d+? number
        // (px(\s|$|\,) px and (space or end string or ,)
        // pt some
        value = value.replace(/(^|\s|-)\d*\.?\d+?(px(\s|$|,)|pt(\s|$|,))\s*/gm,
            (match, p1, p2) => {
                const valueChanged = TemplateEditorComponent.roundToTwo(parseFloat(match) * delta);
                return valueChanged + p2;
            });
        return value;
    }
    private regExSetStyleValue(style, value) {
        // explain in regExScaleStyleValue
        value = TemplateEditorComponent.roundToTwo(value);
        value = style.replace(/(^|\s|-)\d*\.?\d+?(px(\s|$|,)|pt(\s|$|,))\s*/gm,
            (match, p1, p2) => {
                return value + p2;
            });
        return value;
    }


    private applyModifiersToStyle(style, obj, widthToScale, heightToScale) {

        const dW = this.widthEditZone / parseInt(widthToScale, 10);
        const dH = this.heightEditZOne / parseInt(heightToScale, 10);

        const d = dW > dH ? dH : dW;

        const styleName  = style.name;
        const styleValue  = style.value;
        if (style.scaled_flag) {
            const modifiers = style.modifiers;

            let minAll = Number.MAX_SAFE_INTEGER;
            let maxAll = -Number.MAX_SAFE_INTEGER;
            let numModifierApplied = 0;
            for (const modifiersKey in modifiers) {
                if (!modifiers.hasOwnProperty(modifiersKey)) {
                    continue;
                }
                const modifierStyle = modifiers[modifiersKey];
                const modifier      = this.modifiersList[modifierStyle.ID];
                let   modifierValue = modifier.value;

                if (modifierValue === null ||
                    modifierValue === undefined ||
                    modifierValue === '') {
                    continue;
                }
                numModifierApplied++;
                modifierValue = parseFloat(modifierValue);

                const min    = modifierStyle.min;
                const max    = modifierStyle.max;
                const result = (modifierValue - min) / (max - min);

                const minAttr = modifierStyle.minAttr;
                const maxAttr = modifierStyle.maxAttr;

                const wayAttr    = minAttr - maxAttr;
                const resultAttr = minAttr - (wayAttr * result);

                if (minAll > resultAttr) {
                    minAll = resultAttr;
                }

                if (maxAll < resultAttr) {
                    maxAll = resultAttr;
                }
            }

            if (numModifierApplied > 1) {
                const wayAll  = minAll - maxAll;
                let resultAll = minAll - (wayAll * 0.5);
                resultAll *= d;
                obj.formattedStyles[styleName] = this.regExSetStyleValue(styleValue, resultAll);
                console.log(obj.formattedStyles[styleName], styleName);
            } else if (numModifierApplied > 0) {
                let resultAll = minAll;
                resultAll *= d;
                obj.formattedStyles[styleName] = this.regExSetStyleValue(styleValue, resultAll);
                console.log(obj.formattedStyles[styleName], styleName);
            }
        }
        this.applyFormattedStyles(obj);
    }

    dropLayer(event: CdkDragDrop<string[]>) {
        moveItemInArray(this.templateInfo.objects, event.previousIndex, event.currentIndex);
    }


    refreshEditConstraintsChanged() {
        this.heightEdit = this.heightEditTMP;
        this.widthEdit  = this.widthEditTMP;

        this.clearInputFindTemplate();
    }

    inputEditKeyDownConstraintsChanged(event) {
        if (event.keyCode === 13) {
            this.refreshEditZoneConstraintsChanged();
        }
    }

    refreshEditZoneConstraintsChanged() {
        this.heightEditZOne = this.heightEditZOneTMP;
        this.widthEditZone  = this.widthEditZoneTMP;

        this.clearInputFindTemplate();
    }

    inputEditZoneKeyDownConstraintsChanged(event) {
        if (event.keyCode === 13) {
            this.refreshEditZoneConstraintsChanged();
        }
    }

    scaleStyleVarToWidthEdit(style, styleName, fromWidth, fromHeight) {
        const dW = this.widthEdit / fromWidth;
        const dH = this.heightEdit / fromHeight;
        const d = dW > dH ? dH : dW;
        style[styleName].value = this.regExScaleStyleValue(d, style[styleName].value + '');
    }






    getVerticalLineConstraints() {
        const styles = {};
        styles['opacity'] = this.verticalEditLineStyles['opacity'];
        styles['top']     = this.verticalEditLineStyles['top'];
        styles['left']    = this.verticalEditLineStyles['left'];
        styles['width']   = this.verticalEditLineStyles['width'];
        return styles;
    }

    getHorizontalLineConstraints() {
        const styles = {};
        styles['opacity'] = this.horizontalEditLineStyles['opacity'];
        styles['top']     = this.horizontalEditLineStyles['top'];
        styles['left']    = this.horizontalEditLineStyles['left'];
        styles['height']  = this.horizontalEditLineStyles['height'];
        return styles;
    }




    updateConstraintsSizeObjectProcess(object, event) {
        this.verticalEditLineStyles = {};
        this.horizontalEditLineStyles = {};

        const dW = this.widthEdit / this.widthEditZone;
        const dH = this.heightEdit / this.heightEditZOne;
        const d = dW > dH ? dH : dW;

        const styles = object.styles[object.styleID];

        object.formattedStyles['width']  = event.w    + 'px';
        object.formattedStyles['height'] = event.h    + 'px';
        object.formattedStyles['top']    = event.top  + 'px';
        object.formattedStyles['left']   = event.left + 'px';

        styles.width.value  = Math.round( event.w    * d) + 'px';
        styles.height.value = Math.round( event.h    * d) + 'px';
        styles.top.value    = Math.round( event.top  * d) + 'px';
        styles.left.value   = Math.round( event.left * d) + 'px';

        this.applyFormattedStyles(object);
    }

    updateConstraintsPositionObject($event) {
        this.verticalEditLineStyles = {};
        this.horizontalEditLineStyles = {};

        const dW = this.widthEdit / this.widthEditZone;
        const dH = this.heightEdit / this.heightEditZOne;

        const d = dW > dH ? dH : dW;

        const object = $event.objectDragged;
        const styles = object.styles[object.styleID];

        object.formattedStyles['top']  = $event.top  + 'px';
        object.formattedStyles['left'] = $event.left + 'px';

        styles.top.value  = Math.round(  $event.top  * d) + 'px';
        styles.left.value = Math.round(  $event.left * d) + 'px';

        this.applyFormattedStyles(object);
    }



    private applyModifiers(templateInfo) {
        const objs = templateInfo.objects;
        for (const objKey in objs) {
            if (!objs.hasOwnProperty(objKey)) {
                continue;
            }
            const obj = objs[objKey];
            const styles = obj.styles[obj.styleID];
            for (const styleKey in styles) {
                if (!styles.hasOwnProperty(styleKey)) {
                    continue;
                }
                const style = styles[styleKey];
                this.applyModifiersToStyle(style, obj, this.widthEdit, this.heightEdit);
            }
        }
    }

    private getLibraryObjectsStyle() {
        const styles = {};
        styles['left'] = this.libraryObjectsStyles['left'];
        styles['top'] = this.libraryObjectsStyles['top'];
        return styles;
    }

    getEditZoneStyles() {
        const styles = {};
        styles['width'] = this.widthEditZone + 'px';
        styles['height'] = this.heightEditZOne + 'px';
        return styles;
    }
}
