import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Batch } from '../models/batch.model';
import { environment } from '../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class BatchService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/batch`;

  getBatches(page = 1, limit = 20, search = ''): Observable<any> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());
    
    if (search) {
      params = params.set('search', search);
    }
    return this.http.get<any>(this.apiUrl, { params });
  }

  getBatchById(id: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${id}`);
  }

  createBatch(batch: Batch): Observable<any> {
    return this.http.post<any>(this.apiUrl, batch);
  }

  updateBatch(id: string, batch: Partial<Batch>): Observable<any> {
    return this.http.patch<any>(`${this.apiUrl}/${id}`, batch);
  }

  deleteBatch(id: string): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${id}`);
  }
}