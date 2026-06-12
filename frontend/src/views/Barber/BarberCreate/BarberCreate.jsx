import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { getActiveNavItem } from "../../../utils/navHelper";
import { FiArrowLeft, FiPlus } from "react-icons/fi";
import { createBarber } from "../../../services/adminService";
import BottomNav from "../../../components/BottomNav/BottomNav";
import "./BarberCreate.css";

const weekDays = Array.from({ length: 7 }).map((_, i) => ({
  id: i,
  label: new Intl.DateTimeFormat("pt-BR", { weekday: "narrow" })
    .format(new Date(2023, 0, i + 1))
    .charAt(0)
    .toUpperCase(),
}));

const initialState = {
  name: "",
  email: "",
  phone: "",
  password: "",
  startTime: "09:00",
  endTime: "19:00",
  selectedDays: [1, 2, 3, 4, 5],
  photoBase64: "",
};

export default function BarberCreate({ onBack }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState(initialState);
  const [feedback, setFeedback] = useState({ type: "", message: "" });
  const [loading, setLoading] = useState(false);

  const updateForm = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  const toggleDay = (id) =>
    updateForm(
      "selectedDays",
      form.selectedDays.includes(id)
        ? form.selectedDays.filter((d) => d !== id)
        : [...form.selectedDays, id],
    );

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      return setFeedback({
        type: "error",
        message: "Envie apenas imagens (PNG, JPG).",
      });
    }
    if (file.size > 2 * 1024 * 1024) {
      return setFeedback({
        type: "error",
        message: "A imagem excede o limite de 2MB.",
      });
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      updateForm("photoBase64", reader.result);
      setFeedback({ type: "", message: "" });
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFeedback({ type: "", message: "" });

    const {
      name,
      email,
      phone,
      password,
      selectedDays,
      startTime,
      endTime,
      photoBase64,
    } = form;
    const phoneDigits = phone.replace(/\D/g, "");

    // Validações compactas (Early Returns)
    if (!name.trim() || !email.trim() || !phoneDigits)
      return setFeedback({
        type: "error",
        message: "Preencha nome, email e telefone.",
      });
    if (!/^[A-Za-zÀ-ÖØ-öø-ÿ\s]+$/.test(name.trim()))
      return setFeedback({
        type: "error",
        message: "O nome só pode conter letras e espaços.",
      });
    if (phoneDigits.length < 10 || phoneDigits.length > 11)
      return setFeedback({
        type: "error",
        message: "Telefone deve ter DDD e número válido.",
      });
    if (!selectedDays.length)
      return setFeedback({
        type: "error",
        message: "Selecione pelo menos um dia.",
      });
    if (!startTime || !endTime || startTime === "00:00" || endTime === "00:00")
      return setFeedback({ type: "error", message: "Horários inválidos." });
    if (startTime >= endTime)
      return setFeedback({
        type: "error",
        message: "O término deve ser após o início.",
      });

    setLoading(true);
    try {
      const res = await createBarber({
        name,
        email,
        phone: phoneDigits,
        password,
        availableDays: selectedDays,
        startTime,
        endTime,
        photoUrl: photoBase64,
      });
      setFeedback({
        type: "success",
        message: res.generatedPassword
          ? `Senha temporária: ${res.generatedPassword}`
          : "Barbeiro criado com sucesso.",
      });
      setForm(initialState);
    } catch (error) {
      setFeedback({
        type: "error",
        message: error.message || "Erro ao criar barbeiro.",
      });
    } finally {
      setLoading(false);
    }
  };

  // Componente interno para evitar repetição de HTML
  const InputField = ({ label, id, ...props }) => (
    <div className="barber-field">
      <label htmlFor={id}>{label}</label>
      <input id={id} className="barber-input" {...props} />
    </div>
  );

  return (
    <div className="barber-create-page">
      <div className="barber-create-phone">
        <div className="barber-create-shell">
          <header className="barber-create-header">
            <button
              type="button"
              className="barber-create-back"
              onClick={onBack}
            >
              <FiArrowLeft size={18} />
            </button>
            <h1 className="barber-create-title">Cadastrar Barbeiro</h1>
          </header>

          <main className="barber-create-main">
            <div className="barber-photo">
              <label
                className="barber-photo-btn"
                style={{ overflow: "hidden", cursor: "pointer" }}
              >
                <input
                  type="file"
                  accept="image/png, image/jpeg"
                  onChange={handlePhotoChange}
                  style={{ display: "none" }}
                />
                {form.photoBase64 ? (
                  <img
                    src={form.photoBase64}
                    alt="Pré-visualização"
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                    }}
                  />
                ) : (
                  <FiPlus size={20} />
                )}
              </label>
              <span className="barber-photo-label">FOTO (Opcional)</span>
            </div>

            <form className="barber-form" onSubmit={handleSubmit}>
              <InputField
                label="Nome completo *"
                id="name"
                value={form.name}
                onChange={(e) => updateForm("name", e.target.value)}
              />
              <InputField
                label="E-mail *"
                id="email"
                type="email"
                value={form.email}
                onChange={(e) => updateForm("email", e.target.value)}
              />
              <InputField
                label="Telefone (com DDD) *"
                id="phone"
                type="tel"
                maxLength={11}
                placeholder="Ex: 11999999999"
                value={form.phone}
                onChange={(e) =>
                  updateForm("phone", e.target.value.replace(/\D/g, ""))
                }
              />
              <InputField
                label="Senha (Opcional)"
                id="password"
                type="password"
                placeholder="Deixe em branco para gerar"
                value={form.password}
                onChange={(e) => updateForm("password", e.target.value)}
              />

              <div className="barber-field">
                <label>Dias disponíveis</label>
                <div className="barber-days">
                  {weekDays.map((day) => (
                    <button
                      type="button"
                      key={day.id}
                      className={`barber-day ${form.selectedDays.includes(day.id) ? "is-active" : ""}`}
                      onClick={() => toggleDay(day.id)}
                    >
                      {day.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="barber-field">
                <label>Horário de atendimento</label>
                <div className="barber-time-row">
                  <div className="barber-time-card">
                    <span>Início</span>
                    <input
                      className="barber-time-input"
                      type="time"
                      value={form.startTime}
                      onChange={(e) => updateForm("startTime", e.target.value)}
                    />
                  </div>
                  <div className="barber-time-card">
                    <span>Fim</span>
                    <input
                      className="barber-time-input"
                      type="time"
                      value={form.endTime}
                      onChange={(e) => updateForm("endTime", e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                className="barber-submit"
                disabled={loading}
              >
                {loading ? "Salvando..." : "Concluir cadastro"}
              </button>

              {feedback.message && (
                <div
                  className={`barber-feedback ${feedback.type === "error" ? "barber-feedback--error" : "barber-feedback--success"}`}
                >
                  {feedback.message}
                </div>
              )}
            </form>
          </main>
        </div>
      </div>

      <BottomNav 
        active={getActiveNavItem(location.pathname)}
        onNavigate={(page) => {
          if (page === 'dashboard') navigate('/dashboard-barbeiro');
          else if (page === 'home') navigate('/barber-dashboard');
          else if (page === 'profile') navigate('/barber-chief?section=menu');
        }}
      />
    </div>
  );
}
