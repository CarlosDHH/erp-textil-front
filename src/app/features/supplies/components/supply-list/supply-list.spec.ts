import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SupplyList } from './supply-list';

describe('SupplyList', () => {
  let component: SupplyList;
  let fixture: ComponentFixture<SupplyList>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SupplyList]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SupplyList);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
