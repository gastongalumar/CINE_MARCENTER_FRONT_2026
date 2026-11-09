import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';

@Component({
  selector: 'app-promos',
  standalone: true,
  imports: [CommonModule, RouterModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './promos.html',
  styleUrls: ['./cumpleanos.css'],
})
export class PromosComponent {
  private readonly route = inject(ActivatedRoute);

  readonly destacada = this.route.snapshot.queryParamMap.get('p');

  readonly promos = [
    {
      id: 'happy-hour',
      icon: 'schedule',
      titulo: 'Cinema Happy Hour',
      texto:
        '2x1 en entradas de jueves a martes en funciones que empiecen antes de las 18 hs. Válido presentando la promo en boletería. No acumulable con otras ofertas del mismo día.',
    },
    {
      id: 'miercoles',
      icon: 'sell',
      titulo: 'Miércoles de rebajas',
      texto:
        '25% de descuento en entradas todos los miércoles, en cualquier función. Ideal para estrenos a mitad de semana. Consultá salas disponibles en cartelera.',
    },
    {
      id: 'planazo',
      icon: 'groups',
      titulo: 'Planazo de amigos',
      texto:
        'Jueves y viernes: vienen 4, pagan 2. Las 4 entradas deben ser para la misma función y sala. Pedilo en boletería mencionando “Planazo Marcenter”.',
    },
    {
      id: 'mp-qr',
      icon: 'qr_code_2',
      titulo: 'Mercado Pago QR en Candy',
      texto:
        '10% off en combos y snacks del Candy Bar pagando con QR de Mercado Pago. El descuento se aplica en el momento; no válido para entradas. Ref. CMB-MP-QR.',
    },
    {
      id: 'tarjeta',
      icon: 'credit_card',
      titulo: 'Tarjeta Marcenter',
      texto:
        '2x1 en entradas seleccionadas pagando con Tarjeta Marcenter (beneficio simulado para el TP). Consultá días y películas vigentes en boletería.',
    },
  ];

  esDestacada(id: string): boolean {
    return this.destacada === id;
  }
}
