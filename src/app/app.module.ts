import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { AutorizationComponent } from './autorization/autorization.component';
import { HomeComponent } from './home/home.component';
import { LoginComponent } from './login/login.component';
import { LocalStorageModule } from 'angular-2-local-storage';
import { HttpClientModule, HttpClientJsonpModule } from '@angular/common/http';
import { FlexLayoutModule } from '@angular/flex-layout';
import { AlertModule } from 'ngx-alerts';
import { MatInputModule } from '@angular/material/input';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MatButtonModule } from '@angular/material/button';
import { TemplateEditorComponent } from './template-editor/template-editor.component';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { FormsModule, ReactiveFormsModule} from '@angular/forms';
import { NgxLoadingModule } from 'ngx-loading';
import { AngularDraggableModule } from 'angular2-draggable';
import { ResizableModule } from 'angular-resizable-element';
import { MatIconModule } from '@angular/material';
import { MatBottomSheetModule } from '@angular/material/bottom-sheet';
import { NumberDirective } from './directives/NumbersOnly';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatRippleModule } from '@angular/material/core';
import { MatTabsModule } from '@angular/material/tabs';
import { MatDialogModule } from '@angular/material/dialog';
import { ClickOutsideModule } from 'ng-click-outside';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { MatSelectModule } from '@angular/material/select';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatRadioModule } from '@angular/material/radio';
import { EasyDragDirective } from './directives/Draggable';
import { MatTreeModule } from '@angular/material/tree';
import { DragToSelectModule } from 'ngx-drag-to-select';

import { ScrollingModule } from '@angular/cdk-experimental/scrolling';
import { ScrollDispatchModule } from '@angular/cdk/scrolling';


import { CollectionDragFrameDirective } from './directives/CollectionDragFrameDirective';
import { DragCollectionDirective } from './directives/DragCollectionDirective';
import { EasyFlipResizeDirective } from './directives/easyFlipper';
import {ObjectDragPreviewDirective} from './directives/ObjectDragPreview';

@NgModule({
    declarations: [
        DragCollectionDirective,
        CollectionDragFrameDirective,
        ObjectDragPreviewDirective,
        EasyFlipResizeDirective,
        EasyDragDirective,
        NumberDirective,
        AppComponent,
        AutorizationComponent,
        HomeComponent,
        LoginComponent,
        TemplateEditorComponent
    ],
    entryComponents: [
    ],
    imports: [
        ScrollingModule,
        ScrollDispatchModule,
        DragToSelectModule.forRoot(),
        MatTreeModule,
        MatRadioModule,
        MatSlideToggleModule,
        MatCheckboxModule,
        NgbModule,
        MatSelectModule,
        DragDropModule,
        ClickOutsideModule,
        MatDialogModule,
        MatTabsModule,
        MatRippleModule,
        MatSidenavModule,
        MatBottomSheetModule,
        MatIconModule,
        ResizableModule,
        AngularDraggableModule,
        NgxLoadingModule.forRoot({}),
        MatAutocompleteModule,
        FormsModule,
        ReactiveFormsModule,
        BrowserAnimationsModule,
        MatInputModule,
        MatButtonModule,
        AlertModule.forRoot({maxMessages: 5, timeout: 5000}),
        FlexLayoutModule,
        HttpClientModule, HttpClientJsonpModule,
        BrowserModule,
        AppRoutingModule,
        LocalStorageModule.forRoot({
            prefix: 'media-brain',
            storageType: 'localStorage'
        })
    ],
    providers: [],
    bootstrap: [AppComponent]
})
export class AppModule { }
