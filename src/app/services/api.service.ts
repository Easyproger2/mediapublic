import {EventEmitter, Injectable} from '@angular/core';
import {HttpClient, HttpHeaders} from '@angular/common/http';
import {environment} from '../../environments/environment';
import {catchError} from 'rxjs/operators';
import {of, Subject, throwError} from 'rxjs';
import {LocalStorageService} from 'angular-2-local-storage';
import {Subscription} from 'rxjs/src/internal/Subscription';


@Injectable({
    providedIn: 'root'
})
export class ApiService {
    public subjects = {

    };
    constructor(private http: HttpClient,
                private _localStorage: LocalStorageService) { }


    _generateUUID() {
        return this._s4() + this._s4() + '-' + this._s4() + '-' + this._s4()
            + '-' + this._s4() + '-' + this._s4() + this._s4() + this._s4();
    }
    _s4() {
        return Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
    }

    getSubject(subjName): Subject<any> {
        if (!this.subjects.hasOwnProperty(subjName)) {
            this.subjects[subjName] = new Subject<any>();
        }
        return this.subjects[subjName];
    }
    createMessage(type, data) {
        return {name: type, udid: this._generateUUID(), ...data};
    }

    sendMessages(messages) {

        if (!(messages instanceof Array)) {
            messages = [messages];
        }

        let sessionToken = this._localStorage.get<string>('X-Session-Token');
        let refreshToken = this._localStorage.get<string>('X-Session-Refresh-Token');

        if (sessionToken == null) {
            sessionToken = 'd9c3df14093c94a7d247e53431c41b2b781c3501';
        }
        if (refreshToken == null) {
            refreshToken = 'c866b45b37994937aa1aa651275f90496e89b28b';
        }

        const httpOptions = {
            headers: new HttpHeaders({
                'Content-Type': 'application/json',
                'X-Session-Token': sessionToken,
                'X-Session-Refresh-Token': refreshToken
            })
        };
        this.http.post(environment.apiUrl, messages, httpOptions)
            .pipe(
                catchError((err: any) => {
                    if (this.subjects.hasOwnProperty('serverError')) {
                        const subject: Subject<any> = this.subjects['serverError'];
                        subject.next(err);
                    }
                    return of(null);
                }))
            .subscribe((_data: any) => {
                if (_data === null) {
                    return;
                }
                for (let i = 0; i < _data.length; i++) {
                    const message = _data[i];
                    if (message.result === false) {
                        console.log('ERROR API', message);
                    }
                    if (this.subjects.hasOwnProperty(message.name)) {
                        const subject: Subject<any> = this.subjects[message.name];
                        subject.next(message);
                    }
                }
            });
    }

}
