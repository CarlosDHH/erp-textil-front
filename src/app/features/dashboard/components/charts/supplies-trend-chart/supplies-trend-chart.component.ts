import { ChangeDetectionStrategy, Component, Input } from '@angular/core'
import { Color, NgxChartsModule, ScaleType } from '@swimlane/ngx-charts'
import { ChartSeries } from '../../../models/dashboard.model'

@Component({
  selector: 'app-supplies-trend-chart',
  standalone: true,
  imports: [NgxChartsModule],
  templateUrl: './supplies-trend-chart.component.html',
  styleUrl: './supplies-trend-chart.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SuppliesTrendChartComponent {
  @Input({ required: true }) series: ChartSeries[] = []

  readonly colorScheme: Color = {
    name: 'suppliesTrend',
    selectable: true,
    group: ScaleType.Ordinal,
    domain: ['#3B82F6', '#22C55E'],
  }
}
