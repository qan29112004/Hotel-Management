export interface RoomSelection {
  adults: number;
  children: number;
  ratePlanName?: string;
  selectedServices: number[];
}

export interface BookingState {
  rooms: RoomSelection[];
  currentRoomIndex: number;
  currentStep: 'rate' | 'service' | 'info';
  customerInfo?: any;
}
