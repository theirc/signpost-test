import { useState, useCallback } from "react";
import { usePaginatedSupabaseTable } from "@/hooks/usePaginatedSupabaseTable";

function cleanFilters(filters, searchKey) {
  if (!filters) return undefined;
  const cleaned = {};
  Object.entries(filters).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== "") {
      if (searchKey && k === searchKey) {
        cleaned[k] = `%${v}%`;
      } else {
        cleaned[k] = v;
      }
    }
  });
  return Object.keys(cleaned).length ? cleaned : undefined;
}

export default function PaginatedSupabaseTableWrapper({
  table,
  columns,
  tableComponent: TableComponent,
  initialPageSize = 10,
  initialOrderBy = "created_at",
  initialOrderDirection = "desc",
  filters,
  initialFilters = {},
  searchKey,
  ...tableProps
}) {
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(initialPageSize);
  const [localFilters, setLocalFilters] = useState(initialFilters);
  const [sorting, setSorting] = useState([]);

  const mergedFilters = { ...(filters || {}), ...localFilters };
  const effectiveFilters = cleanFilters(mergedFilters, searchKey);
  const orderBy = sorting[0]?.id || initialOrderBy;
  const orderDirection = sorting[0] ? (sorting[0].desc ? 'desc' : 'asc') : initialOrderDirection;

  const query = usePaginatedSupabaseTable({
    table,
    page,
    pageSize,
    orderBy,
    orderDirection,
    filters: effectiveFilters,
  });

  const handleSort = useCallback((columnId, direction) => {
    setSorting([{ id: columnId, desc: direction === 'desc' }]);
  }, []);

  const handleFilter = useCallback((newFiltersArr) => {
    const newFilters = {};
    if (Array.isArray(newFiltersArr)) {
      newFiltersArr.forEach(f => {
        if (f.value !== undefined && f.value !== null && f.value !== "") {
          newFilters[f.id] = f.value;
        }
      });
    }
    setLocalFilters(newFilters);
    setPage(0);
  }, []);

  const handlePageChange = useCallback((newPage) => {
    setPage(newPage);
  }, []);

  const handlePageSizeChange = useCallback((newSize) => {
    setPageSize(newSize);
    setPage(0);
  }, []);

  return (
    <TableComponent
      columns={columns}
      data={query.data?.data ?? []}
      page={page}
      pageSize={pageSize}
      pageCount={Math.ceil((query.data?.total ?? 0) / pageSize)}
      totalRecords={query.data?.total ?? 0}
      onPageChange={handlePageChange}
      onSort={handleSort}
      sorting={sorting}
      onFilter={handleFilter}
      onPageSizeChange={handlePageSizeChange}
      loading={query.isFetching}
      searchKey={searchKey}
      {...tableProps}
    />
  );
} 