import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Supply } from '../models/supply.model';
import { environment } from '../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class SupplyService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/supply`;

  getSupplies(page = 1, limit = 20, search = ''): Observable<any> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());

    if (search) {
      params = params.set('search', search);
    }
    return this.http.get<any>(this.apiUrl, { params });
  }

  getSupplyById(id: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${id}`);
  }

  createSupply(supply: Supply): Observable<any> {
    return this.http.post<any>(this.apiUrl, supply);
  }

  updateSupply(id: string, supply: Partial<Supply>): Observable<any> {
    return this.http.patch<any>(`${this.apiUrl}/${id}`, supply);
  }

  deleteSupply(id: string): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${id}`);
  }
}
