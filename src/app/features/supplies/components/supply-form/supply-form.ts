import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { SupplyService } from '../../services/supply';

@Component({
  selector: 'app-supply-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, ButtonModule, InputTextModule],
  templateUrl: './supply-form.html'
})
export class SupplyFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private supplyService = inject(SupplyService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  form!: FormGroup;
  isEdit = false;
  supplyId?: string;

  ngOnInit(): void {
    this.initForm();
    this.supplyId = this.route.snapshot.params['id'];
    
    if (this.supplyId) {
      this.isEdit = true;
      this.loadSupplyData(this.supplyId);
    }
  }

  initForm(): void {
    this.form = this.fb.group({
      code: ['', [Validators.required]],
      name: ['', [Validators.required]],
      type: ['', [Validators.required]],
      unitMeasure: ['', [Validators.required]],
      currentStock: [0, [Validators.required, Validators.min(0)]],
      minStock: [0, [Validators.required, Validators.min(0)]],
    });
  }

  loadSupplyData(id: string): void {
    this.supplyService.getSupplyById(id).subscribe({
      next: (res) => {
        if (res.success) {
          this.form.patchValue(res.data);
        }
      }
    });
  }

  onSubmit(): void {
    if (this.form.invalid) return;

    const supplyData = this.form.value;

    if (this.isEdit && this.supplyId) {
      this.supplyService.updateSupply(this.supplyId, supplyData).subscribe({
        next: (res) => {
          if (res.success) this.router.navigate(['/admin/supplies']);
        }
      });
    } else {
      this.supplyService.createSupply(supplyData).subscribe({
        next: (res) => {
          if (res.success) this.router.navigate(['/admin/supplies']);
        }
      });
    }
  }
}