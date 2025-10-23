function isAuthenticated(request, reply, done) {
  const timestamp = new Date().toISOString();

  if (request.session.userId) {
    console.log(`[${timestamp}] 🔓 Acesso autorizado - User: ${request.session.username} (${request.session.userId})`);
    done();
  } else {
    console.log(`[${timestamp}] 🔒 Acesso negado - Redirecionando para login`);
    reply.redirect('/secret-admin-login');
  }
}

module.exports = { isAuthenticated };
