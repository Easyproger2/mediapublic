import { Injectable } from '@angular/core';
import {ApiService} from '../services/api.service';
import {HttpClient} from '@angular/common/http';
import {LocalStorageService} from 'angular-2-local-storage';
import {Router} from '@angular/router';

@Injectable({
    providedIn: 'root'
})
export class AuthService {
    public isAuthenticated = false;
    public user: any = null;

    constructor(private myRoute: Router,
                private apiService: ApiService,
                private _localStorage: LocalStorageService) {

        this.apiService.getSubject('serverError').subscribe((result) => {
            this.logout();
            this.myRoute.navigate(['/login']);
            return;
        });
    }


    loginWithData(data) {
        this._localStorage.set('X-Session-Token', data['access_token']);
        this._localStorage.set('X-Session-Refresh-Token', data['refresh_token']);
    }

    logout() {
        this.user = null;
        this.isAuthenticated = false;
        this._localStorage.remove('X-Session-Token');
        this._localStorage.remove('X-Session-Refresh-Token');
    }

    isLogged() {
        return new Promise((resolve, reject) => {
            const message = this.apiService.createMessage(
                'getCurrentUser', {});
            const serverevent = this.apiService.getSubject('serverError').subscribe((result) => {
                event.unsubscribe();
                serverevent.unsubscribe();

                reject(false);
            });
            const event = this.apiService.getSubject('getCurrentUser').subscribe((result) => {
                if (result.udid !== message.udid) {
                    return;
                }
                event.unsubscribe();
                serverevent.unsubscribe();

                if (result.result === false) {
                    reject(false);
                    return;
                }
                this.user = result.data.data;
                resolve();
            });


            this.apiService.sendMessages(message);
        });
    }

}
