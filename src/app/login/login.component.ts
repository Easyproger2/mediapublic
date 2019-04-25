import { Component, OnInit } from '@angular/core';
import {ApiService} from '../services/api.service';
import {AlertService} from 'ngx-alerts';
import {AuthService} from '../autorization/auth.service';
import {Router} from '@angular/router';

@Component({
    selector: 'app-login',
    templateUrl: './login.component.html',
    styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {

    public login = '';
    public password = '';
    constructor(private myRoute: Router,
                private apiService: ApiService,
                private alertsService: AlertService,
                private authService: AuthService
                ) { }

    ngOnInit() {
    }

    keyDownFunction(event) {
        if (event.keyCode === 13) {
            this.tryLogin();
        }
    }

    tryLogin() {
        const message = this.apiService.createMessage(
            'auth', {login: this.login, pass: this.password});
        const event = this.apiService.getSubject('auth').subscribe((result) => {
            if (result.udid !== message.udid) {
                return;
            }
            event.unsubscribe();
            if (result.result === false) {
                this.alertsService.danger('Wrong sign data');
                return;
            }
            this.authService.loginWithData(result.data.data);
            this.myRoute.navigate(['/home']);
        });


        this.apiService.sendMessages(message);
    }

}
