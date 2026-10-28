import { Component, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { RegistroRequest } from '../../models/auth.model';

@Component({
  selector: 'app-registro',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './registro.component.html',
  styleUrls: ['./registro.component.css'],
})
export class RegistroComponent {
  userData: RegistroRequest = {
    nombre: '',
    apellido: '',
    email: '',
    password: '',
    telefono: ''
  };
  confirmPassword = '';
  loading = false;

  constructor(
    private authService: AuthService,
    private router: Router
    , private cdr: ChangeDetectorRef
  ) {}

  onSubmit(): void {
    this.loading = true;
    this.authService.registro(this.userData).subscribe({
      next: () => {
        this.loading = false;
        setTimeout(() => this.cdr.detectChanges());
        this.router.navigate(['/login'], {
          queryParams: { registered: 'true' }
        });
      },
      error: (error) => {
        this.loading = false;
        setTimeout(() => this.cdr.detectChanges());
      }
    });
  }
}
