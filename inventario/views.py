from django.shortcuts import render, redirect
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from django.http import HttpResponse
from django.db.models import Sum
from .models import Transaccion
from .forms import TransaccionForm
from datetime import datetime

@login_required
def caja_vista(request):
    if request.method == 'POST':
        form = TransaccionForm(request.POST)
        if form.is_valid():
            transaccion = form.save(commit=False)
            transaccion.usuario = request.user
            transaccion.save()
            messages.success(request, f'{transaccion.tipo.capitalize()} registrado exitosamente.')
            return redirect('inventario:caja_vista')
    else:
        form = TransaccionForm()
    
    # Obtener todas las transacciones
    transacciones = Transaccion.objects.all()
    
    # Calcular totales
    total_ingresos = transacciones.filter(tipo='ingreso').aggregate(Sum('monto'))['monto__sum'] or 0
    total_egresos = transacciones.filter(tipo='egreso').aggregate(Sum('monto'))['monto__sum'] or 0
    balance_total = total_ingresos - total_egresos
    
    context = {
        'form': form,
        'transacciones': transacciones,
        'total_ingresos': total_ingresos,
        'total_egresos': total_egresos,
        'balance_total': balance_total,
    }
    
    return render(request, 'inventario/caja.html', context)

@login_required
def exportar_txt(request):
    transacciones = Transaccion.objects.all()
    
    # Calcular totales
    total_ingresos = transacciones.filter(tipo='ingreso').aggregate(Sum('monto'))['monto__sum'] or 0
    total_egresos = transacciones.filter(tipo='egreso').aggregate(Sum('monto'))['monto__sum'] or 0
    balance_total = total_ingresos - total_egresos
    
    # Crear el contenido del archivo
    contenido = "=" * 80 + "\n"
    contenido += "REPORTE DE INVENTARIO - INGRESOS Y EGRESOS\n"
    contenido += "=" * 80 + "\n"
    contenido += f"Fecha de generación: {datetime.now().strftime('%d/%m/%Y %H:%M:%S')}\n"
    contenido += f"Usuario: {request.user.username}\n"
    contenido += "=" * 80 + "\n\n"
    
    contenido += f"RESUMEN:\n"
    contenido += f"Total Ingresos: ${total_ingresos:,.2f}\n"
    contenido += f"Total Egresos:  ${total_egresos:,.2f}\n"
    contenido += f"Balance Total:  ${balance_total:,.2f}\n"
    contenido += "\n" + "=" * 80 + "\n\n"
    
    contenido += "DETALLE DE TRANSACCIONES:\n\n"
    
    for trans in transacciones:
        contenido += "-" * 80 + "\n"
        contenido += f"ID: {trans.id_transaccion}\n"
        contenido += f"Tipo: {trans.tipo.upper()}\n"
        contenido += f"Monto: ${trans.monto:,.2f}\n"
        contenido += f"Fecha: {trans.fecha_creacion.strftime('%d/%m/%Y %H:%M:%S')}\n"
        contenido += f"Motivo: {trans.motivo}\n"
        if trans.usuario:
            contenido += f"Registrado por: {trans.usuario.username}\n"
        contenido += "\n"
    
    contenido += "=" * 80 + "\n"
    contenido += f"Total de transacciones: {transacciones.count()}\n"
    
    # Crear respuesta HTTP
    response = HttpResponse(contenido, content_type='text/plain; charset=utf-8')
    response['Content-Disposition'] = f'attachment; filename="inventario_reporte_{datetime.now().strftime("%Y%m%d_%H%M%S")}.txt"'
    
    return response
