import { createClient } from "@supabase/supabase-js";

const COMMANDS = new Set(["provision", "cleanup"]);
const command = process.argv[2];

if (!COMMANDS.has(command)) {
  console.error("Uso: node scripts/qa-users.mjs <provision|cleanup>");
  process.exit(1);
}

const confirmToken = process.env.QA_E2E_CONFIRM;
const supabaseUrl = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const password = process.env.QA_E2E_PASSWORD;

if (confirmToken !== "FARMAVERSE_QA") {
  throw new Error("Define QA_E2E_CONFIRM=FARMAVERSE_QA para habilitar operaciones QA.");
}
if (!supabaseUrl) throw new Error("Falta SUPABASE_URL o NEXT_PUBLIC_SUPABASE_URL.");
if (!serviceRoleKey) throw new Error("Falta SUPABASE_SERVICE_ROLE_KEY.");
if (command === "provision" && (!password || password.length < 16)) {
  throw new Error("QA_E2E_PASSWORD debe tener al menos 16 caracteres.");
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

const qaUsers = [
  {
    email: "qa-supervisor@farmaverse.invalid",
    fullName: "QA Supervisor QF",
    role: "supervisor",
    facilityId: "hospital-tome",
  },
  {
    email: "qa-tens-tome@farmaverse.invalid",
    fullName: "QA TENS Tomé",
    role: "learner",
    facilityId: "hospital-tome",
  },
  {
    email: "qa-tens-bellavista@farmaverse.invalid",
    fullName: "QA TENS Bellavista",
    role: "learner",
    facilityId: "cesfam-bellavista",
  },
];

async function listAllUsers() {
  const users = [];
  let page = 1;

  while (true) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 100 });
    if (error) throw error;
    users.push(...data.users);
    if (data.users.length < 100) break;
    page += 1;
  }

  return users;
}

async function findUserByEmail(email) {
  const users = await listAllUsers();
  return users.find((user) => user.email?.toLowerCase() === email.toLowerCase()) ?? null;
}

async function ensureAuthUser(config) {
  const existing = await findUserByEmail(config.email);
  if (existing) {
    const { data, error } = await supabase.auth.admin.updateUserById(existing.id, {
      password,
      email_confirm: true,
      user_metadata: { full_name: config.fullName, qa_e2e: true },
    });
    if (error) throw error;
    return data.user;
  }

  const { data, error } = await supabase.auth.admin.createUser({
    email: config.email,
    password,
    email_confirm: true,
    user_metadata: { full_name: config.fullName, qa_e2e: true },
  });
  if (error) throw error;
  return data.user;
}

async function ensureProfileAndMembership(user, config) {
  const { error: profileError } = await supabase
    .from("profiles")
    .update({
      full_name: config.fullName,
      role: config.role,
      is_training_active: true,
    })
    .eq("id", user.id);
  if (profileError) throw profileError;

  const { error: membershipDeleteError } = await supabase
    .from("profile_facility_memberships")
    .delete()
    .eq("user_id", user.id);
  if (membershipDeleteError) throw membershipDeleteError;

  const { error: membershipInsertError } = await supabase
    .from("profile_facility_memberships")
    .insert({
      user_id: user.id,
      facility_id: config.facilityId,
      is_primary: true,
    });
  if (membershipInsertError) throw membershipInsertError;
}

async function provision() {
  const provisioned = [];

  for (const config of qaUsers) {
    const user = await ensureAuthUser(config);
    await ensureProfileAndMembership(user, config);
    provisioned.push({
      email: config.email,
      facilityId: config.facilityId,
      role: config.role,
      userId: user.id,
    });
  }

  console.table(provisioned);
  console.log("Usuarios QA listos. La contraseña se toma solo desde QA_E2E_PASSWORD y no se imprime.");
}

async function cleanup() {
  const users = await listAllUsers();
  const targets = users.filter((user) => qaUsers.some((qaUser) => qaUser.email === user.email));

  for (const user of targets) {
    const { error } = await supabase.auth.admin.deleteUser(user.id);
    if (error) throw error;
    console.log(`Eliminado usuario QA ${user.email}`);
  }

  console.log(`Limpieza QA completada. Usuarios eliminados: ${targets.length}`);
}

if (command === "provision") await provision();
else await cleanup();
