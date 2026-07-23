import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Supplier } from '../models/supplier.model';

@Injectable({
  providedIn: 'root'
})
export class SupplierService {
  private http = inject(HttpClient);
  // Asegúrate de que esta URL coincida con tu environment
  private apiUrl = 'http://localhost:3000/api/suppliers'; 

  getSuppliers(page = 1, limit = 20, search = ''): Observable<any> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());
    
    if (search) {
      params = params.set('search', search);
    }
    return this.http.get<any>(this.apiUrl, { params });
  }

  getSupplierById(id: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${id}`);
  }

  createSupplier(supplier: Supplier): Observable<any> {
    return this.http.post<any>(this.apiUrl, supplier);
  }

  updateSupplier(id: string, supplier: Partial<Supplier>): Observable<any> {
    return this.http.patch<any>(`${this.apiUrl}/${id}`, supplier);
  }

  deleteSupplier(id: string): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${id}`);
  }
}