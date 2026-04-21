import { Routes, Route } from "react-router-dom";
import AppLayout      from "./Components/Layouts/AppLayout";
import Login          from "./Pages/Login";
import Dashboard      from "./Pages/Dashboard";
import Patients       from "./Pages/Patients";
import Doctors        from "./Pages/Doctors";
import DoctorPage     from "./Pages/doctors/DoctorPage";
import Appointments   from "./Pages/Appointments";
import MedicalRecords from "./Pages/MedicalRecords";
import Wards          from "./Pages/Wards";
import Billing        from "./Pages/Billing";
import NotFound       from "./Pages/NotFound";

export default function App() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/login" element={<Login />} />

      {/* Protected */}
      <Route element={<AppLayout />}>
        <Route path="/"                 element={<Dashboard />} />
        <Route path="/patients"         element={<Patients />} />
        <Route path="/doctors"          element={<Doctors />} />
        <Route path="/doctors/:id"      element={<DoctorPage />} />
        <Route path="/appointments"     element={<Appointments />} />
        <Route path="/medical-records"  element={<MedicalRecords />} />
        <Route path="/wards"            element={<Wards />} />
        <Route path="/billing"          element={<Billing />} />
      </Route>

      {/* 404 — catches everything else */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

