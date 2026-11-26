import {
  faBath,
  faBed,
  faBriefcase,
  faBroom,
  faChair,
  faCouch,
  faDoorOpen,
  faFan,
  faFireExtinguisher,
  faLaptop,
  faLayerGroup,
  faSoap,
  faShoePrints,
  faShower,
  faSnowflake,
  faTv,
  faUtensils,
  faWater,
  faWifi,
  faWineBottle,
} from "@fortawesome/free-solid-svg-icons";

export const ROOM_AMENITY_GROUPS = [
  { name: "Bathroom", items: [
    { label: "Free toiletries", icon: faSoap },
    { label: "Private bathroom", icon: faBath },
    { label: "Rainfall showerhead", icon: faShower },
    { label: "Shower", icon: faShower },
    { label: "Slippers", icon: faShoePrints },
    { label: "Towels", icon: faWater },
  ] },
  { name: "Bedroom", items: [
    { label: "1 bedroom", icon: faBed },
    { label: "Air conditioning", icon: faSnowflake },
    { label: "Ceiling fan", icon: faFan },
    { label: "Frette Italian sheets", icon: faLayerGroup },
    { label: "Premium bedding", icon: faBed },
    { label: "Rollaway/extra bed not available", icon: faBed },
    { label: "Tempur-Pedic mattress", icon: faBed },
  ] },
  { name: "Entertainment", items: [
    { label: "32-inch LED TV with satellite channels and streaming services", icon: faTv },
  ] },
  { name: "Food and drink", items: [
    { label: "Minibar", icon: faWineBottle },
    { label: "Room service (limited hours)", icon: faUtensils },
  ] },
  { name: "Internet", items: [
    { label: "Free WiFi", icon: faWifi },
  ] },
  { name: "More", items: [
    { label: "Connecting rooms available", icon: faDoorOpen },
    { label: "Desk", icon: faChair },
    { label: "Housekeeping (daily)", icon: faBroom },
    { label: "Individually decorated", icon: faChair },
    { label: "Individually furnished", icon: faCouch },
    { label: "Laptop workspace", icon: faLaptop },
    { label: "Sitting area", icon: faCouch },
  ] },
  { name: "Safety", items: [
    { label: "Fire extinguisher", icon: faFireExtinguisher },
  ] },
];

export const ROOM_AMENITY_MAP = new Map(ROOM_AMENITY_GROUPS.flatMap((group) => group.items.map((item) => [item.label, { ...item, group: group.name }])));
