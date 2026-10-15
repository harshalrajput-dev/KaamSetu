export function dashboardPathFor(role) {
  if (role === "super_admin") return "/admin";
  if (role === "naka_admin") return "/naka";
  if (role === "worker") return "/worker";
  return "/dashboard";
}