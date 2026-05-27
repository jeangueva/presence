import { Component, type ReactNode } from "react";

type Props = { children: ReactNode };
type State = { hasError: boolean; message?: string };

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(err: unknown): State {
    return { hasError: true, message: (err as Error)?.message };
  }

  componentDidCatch(error: Error, info: { componentStack?: string }) {
    // TODO: enviar a Sentry / observabilidad cuando esté configurado.
    console.error("[ErrorBoundary] uncaught:", error, info);
  }

  reset = () => this.setState({ hasError: false, message: undefined });

  render() {
    if (!this.state.hasError) return this.props.children;
    return (
      <div className="min-h-screen bg-warm-fog flex items-center justify-center px-6 py-12 text-center">
        <div className="max-w-md">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-warm-silver mb-3">
            Algo salió mal
          </p>
          <h1 className="font-serif text-4xl text-warm-plum mb-4">
            Encontramos un error inesperado.
          </h1>
          <p className="text-warm-olive mb-5">
            Recarga la página. Si el problema persiste, escríbenos a{" "}
            <strong>soporte@presence.app</strong> con lo que estabas haciendo.
          </p>
          {this.state.message && (
            <p className="text-xs font-mono text-warm-silver bg-warm-fog rounded-xl p-3 mb-5 break-all">
              {this.state.message}
            </p>
          )}
          <div className="flex justify-center gap-2">
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="btn-primary"
            >
              Recargar
            </button>
            <button type="button" onClick={this.reset} className="btn-secondary">
              Intentar de nuevo
            </button>
          </div>
        </div>
      </div>
    );
  }
}
