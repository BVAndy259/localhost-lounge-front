import { Link } from "react-router-dom";

const galleryImages = [
  "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1514933651103-005eec06c04b?auto=format&fit=crop&w=900&q=80",
];

export const RestaurantPage = () => {
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border bg-secondary/10">
        <div className="absolute inset-0 bg-linear-to-b from-black/40 to-transparent" />
        <div className="relative mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-5xl text-center">
            <h1 className="text-5xl font-black tracking-tight text-white sm:text-6xl">Casa Miraflores</h1>
            <p className="mt-4 text-base text-muted-foreground sm:text-lg">
              Sabores peruanos, tradición y cariño en cada plato. Ven a
              descubrir nuestra historia, eventos y servicios.
            </p>
          </div>
        </div>
        <div className="pointer-events-none absolute inset-0 z-0">
          <img
            src="/public/hero-restaurant.jpg"
            alt="Hero restaurante"
            className="h-full w-full object-cover opacity-60"
            loading="lazy"
          />
        </div>
      </section>

      {/* Intro: texto + collage */}
      <section className="mx-auto grid max-w-7xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:px-8 lg:py-20">
        <div className="space-y-6 self-center">
          <p className="text-xs font-bold uppercase tracking-widest text-primary">Te brindamos</p>
          <h2 className="text-3xl font-black text-white sm:text-4xl">Sabor peruano en cada plato</h2>
          <p className="text-sm leading-7 text-muted-foreground">
            Somos un restaurante con más de una década de tradición, enfocados
            en preservar los sabores de la gastronomía peruana. Ven y disfruta
            del ambiente cálido y la experiencia de nuestro equipo.
          </p>
          <Link to="/reservar" className="inline-block rounded bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground">Reservaciones</Link>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-lg">
            <img src={galleryImages[0]} alt="galeria-1" className="h-56 w-full object-cover" loading="lazy" />
          </div>
          <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-lg">
            <img src={galleryImages[1]} alt="galeria-2" className="h-56 w-full object-cover" loading="lazy" />
          </div>
          <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-lg sm:col-span-2">
            <img src={galleryImages[2]} alt="galeria-3" className="h-72 w-full object-cover" loading="lazy" />
          </div>
        </div>
      </section>

      {/* Plato destacado */}
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid items-center gap-10 lg:grid-cols-2">
          <div>
            <img src="https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1200&q=80" alt="Plato de la casa" className="rounded-2xl w-full object-cover" loading="lazy" />
          </div>
          <div>
            <h3 className="text-2xl font-black text-white">Plato de la casa, una exquisitez</h3>
            <p className="mt-4 text-sm leading-7 text-muted-foreground">
              Nuestro plato estrella combina ingredientes tradicionales con un
              toque contemporáneo. Preparado por manos expertas para ofrecer
              una experiencia auténtica.
            </p>
          </div>
        </div>
      </section>

      {/* Servicios (grid similar a ejemplo) */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <h4 className="text-center text-3xl font-black text-white">Nuestros servicios</h4>
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-border bg-card p-6 text-center">
            <p className="text-lg font-bold text-white">Sabor peruano en cada plato</p>
          </div>
          <div className="rounded-2xl border border-border bg-card p-6 text-center">
            <p className="text-lg font-bold text-white">Eventos especiales</p>
          </div>
          <div className="rounded-2xl border border-border bg-card p-6 text-center">
            <p className="text-lg font-bold text-white">Catering</p>
          </div>
          <div className="rounded-2xl border border-border bg-card p-6 text-center">
            <p className="text-lg font-bold text-white">Buffet con reserva</p>
          </div>
        </div>
      </section>

      {/* Chef / Equipo */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-2">
          <div className="flex items-center justify-center">
            <img src="/public/chef.jpg" alt="Chef" className="rounded-2xl w-72 object-cover" loading="lazy" />
          </div>
          <div className="flex items-center">
            <div className="rounded-2xl border border-border bg-card p-8">
              <h5 className="text-xl font-bold text-white">Lourdes Cuba, Chef Maestro</h5>
              <p className="mt-4 text-sm leading-7 text-muted-foreground">
                Nuestra chef principal lidera la cocina con más de 20 años de
                experiencia, rescatando recetas tradicionales y dándoles un
                sello personal que distingue cada plato.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Suscripción */}
      <section className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="rounded-2xl border border-border bg-card p-8 text-center">
          <h6 className="text-xl font-bold text-white">Suscríbete y recibe muchos beneficios</h6>
          <form className="mt-6 flex flex-col items-center gap-3 sm:flex-row">
            <input placeholder="Email" type="email" className="w-full rounded-md border border-border bg-transparent px-3 py-2 text-sm text-white" />
            <button className="w-full rounded-md bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground sm:w-auto">Suscribirse</button>
          </form>
        </div>
      </section>

      {/* Mapa */}
      <section className="border-t border-border bg-secondary/10">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="grid gap-8 lg:grid-cols-2">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-primary">Ubicación</p>
              <h2 className="mt-2 text-3xl font-black text-white">Casa Miraflores</h2>
              <p className="mt-4 text-sm leading-6 text-muted-foreground">Av Alfredo Benavides 2392, Miraflores, Lima, Perú</p>
            </div>
            <div className="overflow-hidden rounded-2xl border border-border bg-card">
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3769.123456789!2d-77.032!3d-12.123!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2sCasa%20Miraflores!5e0!3m2!1ses-419!2spe!4v0000000000000"
                className="h-80 w-full border-0"
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="Mapa de Casa Miraflores"
              />
            </div>
          </div>
        </div>
      </section>
    </>
  );
};