import { apiSlice } from './apiSlice';

export const employeeApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // GET /api/v1/employees
    listEmployees: builder.query({
      query: (params = {}) => ({
        url: '/employees',
        params,
      }),
      providesTags: (result) =>
        result?.employees
          ? [
              ...result.employees.map(({ _id }) => ({ type: 'Employee', id: _id })),
              { type: 'Employee', id: 'LIST' },
            ]
          : [{ type: 'Employee', id: 'LIST' }],
    }),

    // GET /api/v1/employees/me
    getMyProfile: builder.query({
      query: () => '/employees/me',
      providesTags: [{ type: 'Employee', id: 'ME' }],
    }),

    // GET /api/v1/employees/direct-reports
    getDirectReports: builder.query({
      query: () => '/employees/direct-reports',
      providesTags: [{ type: 'Employee', id: 'DIRECT_REPORTS' }],
    }),

    // GET /api/v1/employees/:id
    getEmployeeById: builder.query({
      query: (id) => `/employees/${id}`,
      providesTags: (result, error, id) => [{ type: 'Employee', id }],
    }),

    // POST /api/v1/employees
    createEmployee: builder.mutation({
      query: (body) => ({
        url: '/employees',
        method: 'POST',
        body,
      }),
      invalidatesTags: [{ type: 'Employee', id: 'LIST' }],
    }),

    // PUT /api/v1/employees/:id
    updateEmployee: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/employees/${id}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Employee', id },
        { type: 'Employee', id: 'LIST' },
        { type: 'Employee', id: 'ME' },
      ],
    }),

    // DELETE /api/v1/employees/:id
    deleteEmployee: builder.mutation({
      query: (id) => ({
        url: `/employees/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: [{ type: 'Employee', id: 'LIST' }],
    }),
  }),
});

export const {
  useListEmployeesQuery,
  useGetMyProfileQuery,
  useGetDirectReportsQuery,
  useGetEmployeeByIdQuery,
  useCreateEmployeeMutation,
  useUpdateEmployeeMutation,
  useDeleteEmployeeMutation,
} = employeeApiSlice;

