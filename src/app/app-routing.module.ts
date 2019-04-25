import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import {HomeComponent} from './home/home.component';
import {AuthGuard} from './autorization/auth.guard';
import {LoginComponent} from './login/login.component';
import {TemplateEditorComponent} from './template-editor/template-editor.component';

const routes: Routes = [
    { path: '', component: HomeComponent, pathMatch: 'full' , canActivate: [AuthGuard]},
    { path: 'login', component: LoginComponent},
    { path: 'template', component: TemplateEditorComponent, canActivate: [AuthGuard]},
    { path: 'home', component: HomeComponent, canActivate: [AuthGuard]}
];

@NgModule({
    imports: [RouterModule.forRoot(routes)],
    exports: [RouterModule]
})
export class AppRoutingModule { }

