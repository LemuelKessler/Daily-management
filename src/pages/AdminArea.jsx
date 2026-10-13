
import React from 'react';
import { Link } from 'react-router-dom';
import { Building2, Upload, Download, ChevronRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import ExportSourceButton from '@/components/ExportSourceButton';

const adminOptions = [
  {
    title: 'Gestão de Hubs',
    description: 'Cadastrar, editar e gerenciar os HUBs da operação.',
    icon: Building2,
    path: '/hubs',
    action: 'Acessar Hubs',
  },
  {
    title: 'Importar relatórios',
    description: 'Importar dados para o sistema operacional.',
    icon: Upload,
    path: '/import',
    action: 'Importar dados',
  },
];

export default function AdminArea() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Área Administrativa
        </h1>
        <p className="text-muted-foreground mt-1">
          Gerencie cadastros e operações de importação e exportação de dados.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {adminOptions.map((option) => {
          const Icon = option.icon;

          return (
            <Card
              key={option.path}
              className="border shadow-sm hover:shadow-md transition-shadow"
            >
              <CardHeader>
                <div className="w-11 h-11 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center">
                  <Icon className="w-5 h-5" />
                </div>
                <CardTitle className="pt-2">{option.title}</CardTitle>
              </CardHeader>

              <CardContent>
                <p className="text-sm text-muted-foreground min-h-10">
                  {option.description}
                </p>

                <Link
                  to={option.path}
                  className="mt-4 inline-flex items-center gap-2 rounded-lg bg-primary text-primary-foreground px-4 py-2 text-sm font-medium hover:opacity-90 transition-opacity"
                >
                  {option.action}
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </CardContent>
            </Card>
          );
        })}

        <Card className="border shadow-sm">
          <CardHeader>
            <div className="w-11 h-11 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center">
              <Download className="w-5 h-5" />
            </div>
            <CardTitle className="pt-2">Exportar dados</CardTitle>
          </CardHeader>

          <CardContent>
            <p className="text-sm text-muted-foreground min-h-10">
              Exporte os dados disponíveis no sistema.
            </p>

            <div className="mt-4">
              <ExportSourceButton />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
