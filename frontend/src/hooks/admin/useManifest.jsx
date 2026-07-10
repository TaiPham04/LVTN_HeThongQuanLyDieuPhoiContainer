import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';

export function useManifestDanhSach(machuyentau) {
  return useQuery({
    queryKey: ['admin-manifest', machuyentau],
    queryFn: () => api.get(`/admin/manifest/danh-sach/${machuyentau}`).then(r => r.data),
    enabled: !!machuyentau,
  });
}

export function useManifestImport() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ machuyentau, file, force = false }) => {
      const form = new FormData();
      form.append('machuyentau', machuyentau);
      form.append('file', file);
      const url = force ? '/admin/manifest/import-force' : '/admin/manifest/import';
      return api.post(url, form, { headers: { 'Content-Type': 'multipart/form-data' } }).then(r => r.data);
    },
    onSuccess: (_, { machuyentau }) => qc.invalidateQueries({ queryKey: ['admin-manifest', machuyentau] }),
  });
}

export function useManifestTemplate() {
  return async () => {
    const res = await api.get('/admin/manifest/template', { responseType: 'blob' });
    const url = URL.createObjectURL(new Blob([res.data]));
    const a   = document.createElement('a');
    a.href     = url;
    a.download = 'manifest_template.xlsx';
    a.click();
    URL.revokeObjectURL(url);
  };
}
