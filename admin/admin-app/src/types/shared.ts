// Shared types for the frontend
export interface ClientEvent {
  _id?: string;
  clientEventId: string;
  projectId: string;
  eventId: string;
  fromDatetime: Date | string;
  toDatetime?: Date | string;
  venue?: string;
  teamMembersAssigned?: string[];
  [key: string]: any;
}
