import { ChangeDetectionStrategy, Component, Input } from '@angular/core'
import { Color, NgxChartsModule, ScaleType } from '@swimlane/ngx-charts'
import { ChartPoint } from '../../../models/dashboard.model'

@Component({
  selector: 'app-users-by-role-chart',
  standalone: true,
  imports: [NgxChartsModule],
  templateUrl: './users-by-role-chart.component.html',
  styleUrl: './users-by-role-chart.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UsersByRoleChartComponent {
  @Input({ required: true }) data: ChartPoint[] = []

  readonly colorScheme: Color = {
    name: 'usersByRole',
    selectable: true,
    group: ScaleType.Ordinal,
    domain: ['#6366F1'],
  }
}
