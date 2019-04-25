import { Injectable } from '@angular/core';
import {CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router} from '@angular/router';
import { Observable } from 'rxjs';
import { LocalStorageService } from 'angular-2-local-storage';
import {AuthService} from './auth.service';


@Injectable({
    providedIn: 'root'
})
export class AuthGuard implements CanActivate {

    constructor(private myRoute: Router,
                private authService: AuthService) {
    }



    canActivate(
        next: ActivatedRouteSnapshot,
        state: RouterStateSnapshot): Observable<boolean> | Promise<boolean> | boolean {

        return new Promise((resolve) => {
            this.authService.isLogged()
                .then((data) => {
                    resolve(true);
                })
                .catch((err) => {
                    this.myRoute.navigate(['/login']);
                    resolve(false);
                });
        });
    }
}
