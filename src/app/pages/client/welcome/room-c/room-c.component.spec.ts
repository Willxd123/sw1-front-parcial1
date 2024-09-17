import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RoomCComponent } from './room-c.component';

describe('RoomCComponent', () => {
  let component: RoomCComponent;
  let fixture: ComponentFixture<RoomCComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RoomCComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RoomCComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
