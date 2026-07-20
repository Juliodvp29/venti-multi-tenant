import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, of, tap } from 'rxjs';

export interface ApiDepartment {
  id: number;
  name: string;
  description?: string;
  cityCount?: number;
}

export interface ApiCity {
  id: number;
  name: string;
  description?: string;
  departmentId: number;
}

@Injectable({
  providedIn: 'root'
})
export class GeographyService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = 'https://api-colombia.com/api/v1';

  // Simple cache
  private departments: ApiDepartment[] = [];
  private citiesByDept: Map<number, ApiCity[]> = new Map();

  getDepartments(): Observable<ApiDepartment[]> {
    if (this.departments.length > 0) {
      return of(this.departments);
    }

    return this.http.get<ApiDepartment[]>(`${this.baseUrl}/Department`).pipe(
      tap(data => this.departments = data)
    );
  }

  getCitiesByDepartment(departmentId: number): Observable<ApiCity[]> {
    if (this.citiesByDept.has(departmentId)) {
      return of(this.citiesByDept.get(departmentId)!);
    }

    return this.http.get<ApiCity[]>(`${this.baseUrl}/Department/${departmentId}/cities`).pipe(
      tap(data => this.citiesByDept.set(departmentId, data))
    );
  }
}
